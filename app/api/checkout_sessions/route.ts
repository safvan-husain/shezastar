import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { computeCartItemPricing, getCartForCurrentSession } from '@/lib/cart/cart.service';
import type { InstallationOption } from '@/lib/cart/cart.schema';
import { getStorefrontSessionId } from '@/lib/storefront-session';

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, {})
    : null;

export async function POST(req: NextRequest) {
    if (!stripe) {
        console.error('STRIPE_SECRET_KEY is missing.');
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

        let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
        const metadata: Record<string, string> = {
            sessionId,
            billingEmail: billingDetails.email,
            billingCountry: billingDetails.country,
        };
        const billingName = `${billingDetails.firstName} ${billingDetails.lastName}`.trim();
        if (billingName) {
            metadata.billingName = billingName;
        }
        const serializedBilling = JSON.stringify(billingDetails);
        if (serializedBilling.length <= 400) {
            metadata.billingDetails = serializedBilling;
        }

        const body = await req.json().catch(() => ({}));
        const rawItems = Array.isArray(body.items) ? body.items : [];

        // Prepare items for stock validation
        let itemsToValidate: Array<{ productId: string; selectedVariantItemIds: string[]; quantity: number }> = [];

        if (rawItems.length > 0) {
            const processedBuyNowItems: Array<{
                productId: string;
                selectedVariantItemIds: string[];
                quantity: number;
                installationOption: InstallationOption;
                installationLocationId?: string;
                installationLocationDelta?: number;
                installationAddOnPrice: number;
                unitPrice: number;
            }> = [];

            for (const item of rawItems) {
                if (!item || typeof item.productId !== 'string') {
                    continue;
                }

                const rawQuantity = Number(item.quantity);
                if (!Number.isFinite(rawQuantity) || rawQuantity <= 0 || !Number.isInteger(rawQuantity)) {
                    continue;
                }

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

            lineItems = processedBuyNowItems.map((item) => ({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.productId,
                    },
                    unit_amount: Math.round(item.unitPrice * 100),
                },
                quantity: item.quantity,
            }));

            metadata.type = 'buy_now';
            metadata.buyNowItems = JSON.stringify(processedBuyNowItems);
        } else {
            // Standard Cart Flow
            if (!cart || cart.items.length === 0) {
                return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
            }

            itemsToValidate = cart.items.map(item => ({
                productId: item.productId,
                selectedVariantItemIds: item.selectedVariantItemIds,
                quantity: item.quantity
            }));

            lineItems = cart.items.map((item) => {
                return {
                    price_data: {
                        currency: 'usd', // Assuming USD for now. TODO: Make dynamic if needed
                        product_data: {
                            name: item.productId, // Ideally fetch product name, but productId is sufficient for now
                        },
                        unit_amount: Math.round(item.unitPrice * 100), // Stripe expects cents
                    },
                    quantity: item.quantity,
                };
            });
        }

        // Validate stock availability before creating checkout session
        const { validateStockAvailability } = await import('@/lib/product/product.service-stock');
        const stockValidation = await validateStockAvailability(itemsToValidate);

        if (!stockValidation.available) {
            return NextResponse.json({
                error: 'Insufficient stock',
                insufficientItems: stockValidation.insufficientItems
            }, { status: 400 });
        }

        const origin = req.headers.get('origin') || 'http://localhost:3000';

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/checkout/cancel`,
            metadata: metadata,
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error('Error creating checkout session:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
