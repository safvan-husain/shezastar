import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getCartForCurrentSession } from '@/lib/cart/cart.service';
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

        let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
        let metadata: Record<string, string> = { sessionId };

        const body = await req.json().catch(() => ({}));
        const buyNowItems = body.items;

        // Prepare items for stock validation
        let itemsToValidate: Array<{ productId: string; selectedVariantItemIds: string[]; quantity: number }> = [];

        if (buyNowItems && Array.isArray(buyNowItems) && buyNowItems.length > 0) {
            // Buy Now Flow
            itemsToValidate = buyNowItems.map((item: any) => ({
                productId: item.productId,
                selectedVariantItemIds: item.selectedVariantItemIds || [],
                quantity: item.quantity
            }));

            lineItems = buyNowItems.map((item: any) => ({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.productId, // We will fetch details in webhook
                    },
                    unit_amount: Math.round(item.unitPrice * 100),
                },
                quantity: item.quantity,
            }));

            metadata.type = 'buy_now';
            metadata.buyNowItems = JSON.stringify(buyNowItems);
        } else {
            // Standard Cart Flow
            const cart = await getCartForCurrentSession();
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
