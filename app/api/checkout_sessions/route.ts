import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getCartForCurrentSession } from '@/lib/cart/cart.service';
import { getStorefrontSessionId } from '@/lib/storefront-session';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is missing. Please set it in your .env.local file.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {});
// actually I'll just use the one from the error message if it seems valid.

export async function POST(req: NextRequest) {
    try {
        const sessionId = await getStorefrontSessionId();
        if (!sessionId) {
            return NextResponse.json({ error: 'No active session' }, { status: 401 });
        }

        const cart = await getCartForCurrentSession();
        if (!cart || cart.items.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        const origin = req.headers.get('origin') || 'http://localhost:3000';

        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = cart.items.map((item) => {
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

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: lineItems,
            mode: 'payment',
            success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/checkout/cancel`,
            metadata: {
                sessionId: sessionId,
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        console.error('Error creating checkout session:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
