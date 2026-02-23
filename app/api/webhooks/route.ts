import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { clearCart } from '@/lib/cart/cart.service';
import { getCollection } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import { getOrderById, updateOrderStatusById } from '@/lib/order/order.service';
import { getStorefrontSessionBySessionId } from '@/lib/storefront-session';

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-11-17.clover'
    })
    : null;

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

function webhookError(
    status: number,
    code: string,
    message: string,
    context: Record<string, unknown> = {}
) {
    return NextResponse.json({ error: message, code, context }, { status });
}

export async function POST(req: NextRequest) {
    if (!endpointSecret || !stripe) {
        return webhookError(500, 'WEBHOOK_CONFIG_MISSING', 'Webhook secret or Stripe key not configured');
    }

    const sig = req.headers.get('stripe-signature');
    if (!sig) {
        return webhookError(400, 'MISSING_STRIPE_SIGNATURE', 'No stripe-signature header');
    }

    let event: Stripe.Event;

    try {
        const body = await req.text();
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    } catch (err: any) {
        console.error('Webhook signature verification failed', { message: err?.message });
        return webhookError(400, 'INVALID_STRIPE_SIGNATURE', `Webhook Error: ${err?.message ?? 'Invalid signature'}`);
    }

    if (event.type !== 'checkout.session.completed') {
        return NextResponse.json({ received: true });
    }

    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.client_reference_id;

    if (!orderId) {
        console.error('Stripe checkout webhook missing client_reference_id', {
            eventId: event.id,
            sessionId: session.id,
        });
        return webhookError(
            400,
            'MISSING_CLIENT_REFERENCE_ID',
            'checkout.session.completed is missing client_reference_id',
            { eventId: event.id, sessionId: session.id }
        );
    }

    let order: Awaited<ReturnType<typeof getOrderById>>;

    try {
        order = await getOrderById(orderId);
    } catch (error) {
        if (error instanceof AppError && error.code === 'ORDER_NOT_FOUND') {
            console.error('Stripe webhook order not found', {
                eventId: event.id,
                sessionId: session.id,
                orderId,
            });
            return webhookError(
                404,
                'ORDER_NOT_FOUND',
                'Pre-created order not found for checkout.session.completed',
                { eventId: event.id, sessionId: session.id, orderId }
            );
        }

        if (error instanceof AppError && error.code === 'INVALID_ORDER_ID') {
            console.error('Stripe webhook has invalid client_reference_id', {
                eventId: event.id,
                sessionId: session.id,
                orderId,
            });
            return webhookError(
                400,
                'INVALID_CLIENT_REFERENCE_ID',
                'checkout.session.completed has invalid client_reference_id',
                { eventId: event.id, sessionId: session.id, orderId }
            );
        }

        console.error('Unexpected error fetching order for Stripe webhook', {
            eventId: event.id,
            sessionId: session.id,
            orderId,
            error,
        });
        return webhookError(
            500,
            'ORDER_LOOKUP_FAILED',
            'Failed to load order for checkout.session.completed',
            { eventId: event.id, sessionId: session.id, orderId }
        );
    }

    try {
        const status = session.payment_status === 'paid' ? 'paid' : 'pending';
        const wasAlreadyPaid = order.status === 'paid' || order.status === 'completed';

        await updateOrderStatusById(order.id, status);

        const updateData: Record<string, unknown> = {
            paymentProviderSessionId: session.id,
            updatedAt: new Date(),
        };

        if (!order.billingDetails && session.metadata?.billingDetails) {
            try {
                updateData.billingDetails = JSON.parse(session.metadata.billingDetails);
            } catch (parseError) {
                console.error('Failed to parse billing details metadata from Stripe webhook', {
                    eventId: event.id,
                    sessionId: session.id,
                    orderId,
                    parseError,
                });
            }
        }

        const collection = await getCollection<any>('orders');
        await collection.updateOne(
            { _id: new (await import('@/lib/db/mongo-client')).ObjectId(order.id) },
            { $set: updateData }
        );

        const updatedOrder = await getOrderById(order.id);

        if (!wasAlreadyPaid && status === 'paid') {
            for (const item of updatedOrder.items) {
                try {
                    const { reduceVariantStock } = await import('@/lib/product/product.service-stock');
                    await reduceVariantStock(item.productId, item.selectedVariantItemIds, item.quantity);
                } catch (stockError) {
                    console.error('Failed to reduce stock for paid Stripe webhook order item', {
                        eventId: event.id,
                        sessionId: session.id,
                        orderId,
                        productId: item.productId,
                        stockError,
                    });
                }
            }
        }

        if (session.metadata?.type !== 'buy_now') {
            const storefrontSession = await getStorefrontSessionBySessionId(order.sessionId);
            const minimalSession = {
                sessionId: order.sessionId,
                status: 'active' as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                expiresAt: new Date().toISOString(),
                lastActiveAt: new Date().toISOString(),
                userId: storefrontSession?.userId,
            };

            try {
                await clearCart(minimalSession);
            } catch (clearError) {
                console.error('Failed to clear cart after Stripe webhook order payment', {
                    eventId: event.id,
                    sessionId: session.id,
                    orderId,
                    storefrontSessionId: order.sessionId,
                    clearError,
                });
            }
        }
    } catch (error) {
        console.error('Error processing checkout.session.completed', {
            eventId: event.id,
            sessionId: session.id,
            orderId,
            error,
        });
        return webhookError(
            500,
            'CHECKOUT_SESSION_COMPLETED_PROCESSING_FAILED',
            'Error processing checkout.session.completed webhook',
            { eventId: event.id, sessionId: session.id, orderId }
        );
    }

    return NextResponse.json({ received: true });
}
