import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateOrderStatus, createOrder } from '@/lib/order/order.service';
import { clearCart } from '@/lib/cart/cart.service';
import { OrderDocument } from '@/lib/order/model/order.model';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is missing.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-01-27.clover' as any,
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
    if (!endpointSecret) {
        return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
    }

    const sig = req.headers.get('stripe-signature');
    if (!sig) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    let event: Stripe.Event;

    try {
        const body = await req.text();
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const storefrontSessionId = session.metadata?.sessionId;

        if (storefrontSessionId) {
            try {
                // Determine status based on payment_status
                const status = session.payment_status === 'paid' ? 'paid' : 'pending';

                // Create the order
                // Note: ideally we would fetch line items here to fully populate the order
                // For now, we will create a basic order record.
                const orderData: Omit<OrderDocument, '_id' | 'createdAt' | 'updatedAt'> = {
                    sessionId: storefrontSessionId,
                    stripeSessionId: session.id,
                    items: [], // TODO: We should ideally persist items from cart here or fetch from session
                    totalAmount: session.amount_total ? session.amount_total / 100 : 0,
                    currency: session.currency || 'usd',
                    status: status,
                };

                await createOrder(orderData);

                // Clear the cart
                await clearCart(storefrontSessionId);

                console.log(`Order created and cart cleared for session ${storefrontSessionId}`);
            } catch (error) {
                console.error('Error processing checkout.session.completed:', error);
                return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 });
            }
        }
    }

    return NextResponse.json({ received: true });
}
