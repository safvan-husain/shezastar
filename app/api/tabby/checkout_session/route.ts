import { NextRequest, NextResponse } from 'next/server';
import { computeCartItemPricing, getCartForCurrentSession } from '@/lib/cart/cart.service';
import type { InstallationOption } from '@/lib/cart/cart.schema';
import { getStorefrontSessionId } from '@/lib/storefront-session';
import { convertPrice, getExchangeRates } from '@/lib/currency/currency.service';
import { SUPPORTED_CURRENCIES, CurrencyCode } from '@/lib/currency/currency.config';
import { createOrder } from '@/lib/order/order.service';
import { OrderItemDocument } from '@/lib/order/model/order.model';
import { getProduct } from '@/lib/product/product.service';
import { filterImagesByVariants } from '@/lib/product/model/product.model';

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
        const sessionId = await getStorefrontSessionId();
        if (!sessionId) {
            return NextResponse.json({ error: 'No active session' }, { status: 401 });
        }

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
        const rawCurrency = (typeof body.currency === 'string' && body.currency ? body.currency : 'AED'); // Default to AED for Tabby usually
        const targetCurrencyCode = rawCurrency.toUpperCase() as CurrencyCode;

        console.log(`[Tabby Checkout] Initiating session with currency: ${targetCurrencyCode}`);

        const rates = await getExchangeRates();
        const currencyConfig = SUPPORTED_CURRENCIES.find(c => c.code === targetCurrencyCode);

        // Tabby expects amount as string, e.g. "100.00"

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

            // Simplified: No longer building detailed tabbyItems here as we use a summary item later.

            // Calculate total based on items
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
                    console.error(`Failed to re-compute pricing for item ${item.productId}`, error);
                    return NextResponse.json({ error: `Product ${item.productId} unavailable` }, { status: 400 });
                }
            }

            itemsToValidate = freshCartItems.map(item => ({
                productId: item.productId,
                selectedVariantItemIds: item.selectedVariantItemIds,
                quantity: item.quantity
            }));

            // Simplified: No longer building detailed tabbyItems here as we use a summary item later.

            totalAmount = freshCartItems.reduce((sum, item) => {
                const convertedPrice = convertPrice(item.unitPrice, targetCurrencyCode, rates);
                return sum + (convertedPrice * item.quantity);
            }, 0);
        }

        // Preparation for Order Persistence
        const orderItems: OrderItemDocument[] = [];
        const sourceItems = rawItems.length > 0 ? processedBuyNowItems : (await Promise.all(cart.items.map(async item => {
            const pricing = await computeCartItemPricing(item.productId, item.selectedVariantItemIds, item.installationOption, item.installationLocationId);
            return { ...item, unitPrice: pricing.unitPrice };
        })));

        for (const item of sourceItems) {
            try {
                const product = await getProduct(item.productId);
                let productImage = product.images.length > 0 ? product.images[0].url : undefined;
                if (item.selectedVariantItemIds.length > 0) {
                    const matchedImages = filterImagesByVariants(product.images, item.selectedVariantItemIds);
                    if (matchedImages.length > 0) productImage = matchedImages[0].url;
                }

                let variantNames: string[] = [];
                for (const variant of product.variants) {
                    for (const vItem of variant.selectedItems) {
                        if (item.selectedVariantItemIds.includes(vItem.id)) {
                            variantNames.push(`${variant.variantTypeName}: ${vItem.name}`);
                        }
                    }
                }
                const variantName = variantNames.length > 0 ? variantNames.join(', ') : undefined;

                let installationLocationName: string | undefined;
                if (item.installationLocationId && product.installationService?.availableLocations) {
                    const loc = product.installationService.availableLocations.find(l => l.locationId === item.installationLocationId);
                    if (loc) installationLocationName = loc.name;
                }

                orderItems.push({
                    productId: item.productId,
                    productName: product.name,
                    productImage,
                    variantName,
                    selectedVariantItemIds: item.selectedVariantItemIds,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    installationOption: item.installationOption,
                    installationAddOnPrice: (item as any).installationAddOnPrice ?? 0,
                    installationLocationId: item.installationLocationId,
                    installationLocationName,
                    installationLocationDelta: (item as any).installationLocationDelta ?? 0,
                });
            } catch (error) {
                console.error(`Failed to enrich order item ${item.productId}`, error);
                orderItems.push({
                    productId: item.productId,
                    productName: 'Unknown Product',
                    selectedVariantItemIds: item.selectedVariantItemIds,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    installationOption: item.installationOption,
                });
            }
        }

        const totalAmountCalculated = sourceItems.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
        const convertedTotal = convertPrice(totalAmountCalculated, targetCurrencyCode, rates);

        // Create the PENDING order
        const pendingOrder = await createOrder({
            sessionId,
            paymentProvider: 'tabby',
            items: orderItems,
            totalAmount: convertedTotal,
            currency: targetCurrencyCode.toLowerCase(),
            status: 'pending',
            billingDetails: billingDetails,
        });

        // Validate stock
        const { validateStockAvailability } = await import('@/lib/product/product.service-stock');
        const stockValidation = await validateStockAvailability(itemsToValidate);

        if (!stockValidation.available) {
            return NextResponse.json({
                error: 'Insufficient stock',
                insufficientItems: stockValidation.insufficientItems
            }, { status: 400 });
        }

        const origin = req.headers.get('origin') || 'http://localhost:3000';

        // Prepare Tabby Payload
        const meta: any = {
            sessionId: sessionId,
            billingDetails: JSON.stringify(billingDetails),
        };

        if (processedBuyNowItems.length > 0) {
            meta.type = 'buy_now';
            meta.buyNowItems = JSON.stringify(processedBuyNowItems);
        }

        const tabbyPayload = {
            payment: {
                amount: totalAmount.toFixed(2),
                currency: targetCurrencyCode,
                description: `Order for ${billingDetails.email}`,
                buyer: {
                    name: `${billingDetails.firstName} ${billingDetails.lastName}`.trim(),
                    email: billingDetails.email,
                    phone: billingDetails.phone,
                    dob: undefined, // Optional
                },
                shipping_address: {
                    city: billingDetails.city,
                    address: [billingDetails.streetAddress1, billingDetails.streetAddress2].filter(Boolean).join(', '),
                    zip: '00000',
                },
                order: {
                    reference_id: pendingOrder.id,
                    items: [
                        {
                            title: `Order #${pendingOrder.id}`,
                            quantity: 1,
                            unit_price: totalAmount.toFixed(2),
                            reference_id: pendingOrder.id,
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
                failure: `${origin}/checkout/failure`,
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

        if (!response.ok) {
            console.error('Tabby API Error:', responseData);
            return NextResponse.json({ error: 'Failed to create Tabby session', details: responseData }, { status: response.status });
        }

        // Extract web_url
        // Response struct: { configuration: { available_products: { installments: [ { web_url: ... } ] } } }
        const webUrl = responseData.configuration?.available_products?.installments?.[0]?.web_url;

        if (!webUrl) {
            // Maybe rejected?
            if (responseData.status === 'rejected') {
                return NextResponse.json({ error: 'Tabby rejected the payment session', reason: responseData.configuration?.products?.installments?.rejection_reason }, { status: 400 });
            }
            return NextResponse.json({ error: 'Tabby session created but no web_url found' }, { status: 500 });
        }

        return NextResponse.json({ url: webUrl });

    } catch (err: any) {
        console.error('Error creating Tabby checkout session:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
