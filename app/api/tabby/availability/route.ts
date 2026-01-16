
import { NextRequest, NextResponse } from 'next/server';
import { computeCartItemPricing, getCartForCurrentSession } from '@/lib/cart/cart.service';
import type { InstallationOption } from '@/lib/cart/cart.schema';
import { getStorefrontSession } from '@/lib/storefront-session';
import { convertPrice, getExchangeRates } from '@/lib/currency/currency.service';
import { SUPPORTED_CURRENCIES, CurrencyCode } from '@/lib/currency/currency.config';
import { getOrdersByEmail } from '@/lib/order/order.service';
import { getProduct } from '@/lib/product/product.service';
import { getUserById } from '@/lib/auth/auth.service';

const TABBY_API_URL = 'https://api.tabby.ai/api/v2/checkout';

export async function POST(req: NextRequest) {
    const tabbyPublicKey = process.env.TABBY_PUBLIC_KEY;
    const tabbySecretKey = process.env.TABBY_SECRET_KEY;
    const tabbyMerchantCode = process.env.TABBY_MERCHANT_CODE;

    if (!tabbyPublicKey || !tabbySecretKey || !tabbyMerchantCode) {
        console.error('Tabby environment variables are missing.');
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    try {
        const session = await getStorefrontSession();
        if (!session) {
            return NextResponse.json({ error: 'No active session' }, { status: 401 });
        }
        const sessionId = session.sessionId;

        const cart = await getCartForCurrentSession();
        if (!cart || !cart.billingDetails) {
            return NextResponse.json(
                {
                    error: 'Billing details required',
                    code: 'BILLING_DETAILS_REQUIRED',
                },
                { status: 400 }
            );
        }

        const billingDetails = cart.billingDetails;
        const body = await req.json().catch(() => ({}));
        const rawCurrency = (typeof body.currency === 'string' && body.currency ? body.currency : 'AED');
        const targetCurrencyCode = rawCurrency.toUpperCase() as CurrencyCode;

        console.log(`[Tabby Availability Check] Initiating check with currency: ${targetCurrencyCode}`);

        const rates = await getExchangeRates();

        let itemsToValidate: Array<{ productId: string; selectedVariantItemIds: string[]; quantity: number }> = [];
        let totalAmount = 0;
        let processedBuyNowItems: Array<{
            productId: string;
            selectedVariantItemIds: string[];
            quantity: number;
            installationOption: InstallationOption;
            installationLocationId?: string;
            installationLocationDelta?: number;
            installationAddOnPrice: number;
            unitPrice: number;
        }> = [];

        const rawItems = Array.isArray(body.items) ? body.items : [];

        if (rawItems.length > 0) {
            // Buy Now Flow
            for (const item of rawItems) {
                if (!item || typeof item.productId !== 'string') continue;
                const rawQuantity = Number(item.quantity);
                if (!Number.isFinite(rawQuantity) || rawQuantity <= 0 || !Number.isInteger(rawQuantity)) continue;

                const quantity = rawQuantity;
                const selectedVariantItemIds = Array.isArray(item.selectedVariantItemIds)
                    ? item.selectedVariantItemIds.filter((id: unknown): id is string => typeof id === 'string')
                    : [];
                const installationLocationId = typeof item.installationLocationId === 'string' ? item.installationLocationId : undefined;

                const requestedOption: InstallationOption =
                    item.installationOption === 'store'
                        ? 'store'
                        : item.installationOption === 'home'
                            ? 'home'
                            : 'none';

                const pricing = await computeCartItemPricing(item.productId, selectedVariantItemIds, requestedOption, installationLocationId);

                processedBuyNowItems.push({
                    productId: item.productId,
                    selectedVariantItemIds,
                    quantity,
                    installationOption: pricing.installationOption,
                    installationLocationId: pricing.installationLocationId,
                    installationLocationDelta: pricing.installationLocationDelta,
                    installationAddOnPrice: pricing.installationAddOnPrice,
                    unitPrice: pricing.unitPrice,
                });
            }

            if (processedBuyNowItems.length === 0) {
                return NextResponse.json({ error: 'Invalid buy now payload' }, { status: 400 });
            }

            itemsToValidate = processedBuyNowItems.map((item) => ({
                productId: item.productId,
                selectedVariantItemIds: item.selectedVariantItemIds,
                quantity: item.quantity,
            }));

            totalAmount = processedBuyNowItems.reduce((sum, item) => {
                const convertedPrice = convertPrice(item.unitPrice, targetCurrencyCode, rates);
                return sum + (convertedPrice * item.quantity);
            }, 0);

        } else {
            // Standard Cart Flow
            if (!cart || cart.items.length === 0) {
                return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
            }

            const freshCartItems = [];
            for (const item of cart.items) {
                try {
                    const pricing = await computeCartItemPricing(
                        item.productId,
                        item.selectedVariantItemIds,
                        item.installationOption,
                        item.installationLocationId
                    );
                    freshCartItems.push({
                        ...item,
                        unitPrice: pricing.unitPrice,
                    });
                } catch (error) {
                    return NextResponse.json({ error: `Product ${item.productId} unavailable` }, { status: 400 });
                }
            }

            itemsToValidate = freshCartItems.map(item => ({
                productId: item.productId,
                selectedVariantItemIds: item.selectedVariantItemIds,
                quantity: item.quantity
            }));

            totalAmount = freshCartItems.reduce((sum, item) => {
                const convertedPrice = convertPrice(item.unitPrice, targetCurrencyCode, rates);
                return sum + (convertedPrice * item.quantity);
            }, 0);
        }

        // Validate stock
        const { validateStockAvailability } = await import('@/lib/product/product.service-stock');
        const stockValidation = await validateStockAvailability(itemsToValidate);

        if (!stockValidation.available) {
            // For availability check, we might want to return this info but not block strict technical availability check
            // But if stock is out, payment is not available effectively.
            return NextResponse.json({
                error: 'Insufficient stock',
                insufficientItems: stockValidation.insufficientItems
            }, { status: 400 });
        }

        const origin = req.headers.get('origin') || 'http://localhost:3000';

        // Prepare Tabby Payload
        // use a temporary reference ID since we are not creating an order yet
        const tempRefId = `check_${Date.now()}_${sessionId.substring(0, 8)}`;

        const meta: any = {
            sessionId: sessionId,
            billingDetails: JSON.stringify(billingDetails),
            isCheck: 'true'
        };

        if (processedBuyNowItems.length > 0) {
            meta.type = 'buy_now';
            meta.buyNowItems = JSON.stringify(processedBuyNowItems);
        }

        // Fetch Buyer History & Order History if registered
        let buyerHistory: any = undefined;
        let orderHistory: any = undefined;

        if (session.userId) {
            try {
                const user = await getUserById(session.userId);
                if (user) {
                    buyerHistory = {
                        registered_since: user.createdAt,
                        loyalty_level: 0,
                    };

                    const pastOrders = await getOrdersByEmail(billingDetails.email, 10);
                    orderHistory = pastOrders.map(o => ({
                        purchased_at: o.createdAt,
                        amount: o.totalAmount.toFixed(2),
                        status: o.status === 'paid' || o.status === 'completed' ? 'complete' : 'unknown',
                        buyer: {
                            name: `${o.billingDetails?.firstName || billingDetails.firstName} ${o.billingDetails?.lastName || billingDetails.lastName}`.trim(),
                            email: o.billingDetails?.email || billingDetails.email,
                            phone: o.billingDetails?.phone || billingDetails.phone,
                        },
                        shipping_address: {
                            city: o.billingDetails?.city || billingDetails.city,
                            address: [
                                o.billingDetails?.streetAddress1 || billingDetails.streetAddress1,
                                o.billingDetails?.streetAddress2 || billingDetails.streetAddress2
                            ].filter(Boolean).join(', '),
                            zip: (o.billingDetails as any)?.zip || (billingDetails as any).zip || '00000',
                        },
                        items: o.items.map(i => ({
                            title: i.productName,
                            quantity: i.quantity,
                            unit_price: i.unitPrice.toFixed(2),
                            category: 'General',
                        }))
                    }));
                }
            } catch (err) {
                console.error("Failed to fetch user history for Tabby:", err);
            }
        }

        const tabbyPayload = {
            payment: {
                amount: totalAmount.toFixed(2),
                currency: targetCurrencyCode,
                description: `Availability Check for ${billingDetails.email}`,
                buyer: {
                    name: `${billingDetails.firstName} ${billingDetails.lastName}`.trim(),
                    email: billingDetails.email,
                    phone: billingDetails.phone,
                    dob: undefined,
                },
                shipping_address: {
                    city: billingDetails.city,
                    address: [billingDetails.streetAddress1, billingDetails.streetAddress2].filter(Boolean).join(', '),
                    zip: (billingDetails as any).zip || '00000',
                },
                buyer_history: buyerHistory,
                order_history: orderHistory,
                order: {
                    reference_id: tempRefId,
                    items: [
                        {
                            title: `Availability Check`,
                            quantity: 1,
                            unit_price: totalAmount.toFixed(2),
                            reference_id: tempRefId,
                            category: 'General',
                        }
                    ],
                },
                meta: meta,
            },
            lang: 'en',
            merchant_code: tabbyMerchantCode,
            merchant_urls: {
                success: `${origin}/checkout/success`,
                cancel: `${origin}/checkout/cancel`,
                failure: `${origin}/checkout/tabby-failure`,
            }
        };

        const response = await fetch(TABBY_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${tabbySecretKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tabbyPayload),
        });

        const responseData = await response.json();

        // Interpret result
        // If rejected, status is 'rejected'
        // If created, status is 'created' (and needs redirect to be finalized)

        const isRejected = responseData.status === 'rejected';
        const rejectionReason = responseData.configuration?.products?.installments?.rejection_reason || responseData.rejection_reason;

        if (isRejected) {
            return NextResponse.json({ available: false, reason: rejectionReason });
        }

        if (!response.ok) {
            // Some other error
            return NextResponse.json({ available: false, reason: 'Tabby API Error', details: responseData }, { status: response.status });
        }

        // If not rejected and OK, it is available
        return NextResponse.json({ available: true, status: responseData.status });

    } catch (err: any) {
        console.error('Error checking Tabby availability:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
