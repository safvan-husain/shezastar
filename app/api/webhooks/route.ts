import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { clearCart } from '@/lib/cart/cart.service';
import { SUPPORTED_CURRENCIES } from '@/lib/currency/currency.config';
import { getCollection } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import { logger } from '@/lib/logging/logger';
import type { OrderDocument, OrderStatus } from '@/lib/order/model/order.model';
import { getOrderById, updateOrderStatusById } from '@/lib/order/order.service';
import { getStorefrontSessionBySessionId } from '@/lib/storefront-session';
import { withRequestLogging } from '@/lib/logging/request-logger';

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

function toMajorUnitAmount(amount: number, currency?: string): number {
    const normalizedCurrency = currency?.toUpperCase();
    const currencyConfig = SUPPORTED_CURRENCIES.find((item) => item.code === normalizedCurrency);
    const decimals = currencyConfig?.decimals ?? 2;
    return amount / (10 ** decimals);
}

function toExpandableId(value: string | Stripe.PaymentIntent | Stripe.Charge | null): string | null {
    if (!value) {
        return null;
    }

    if (typeof value === 'string') {
        return value;
    }

    return value.id;
}

function mapRefundStatus(status: Stripe.Refund['status']): 'pending' | 'succeeded' | 'failed' {
    if (status === 'succeeded') {
        return 'succeeded';
    }

    if (status === 'failed' || status === 'canceled') {
        return 'failed';
    }

    return 'pending';
}

async function handleCheckoutSessionCompleted(event: Stripe.Event): Promise<NextResponse | null> {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.client_reference_id;

    if (!orderId) {
        await logger.error('Stripe checkout webhook missing client_reference_id', {
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
            await logger.error('Stripe checkout webhook order not found', {
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
            await logger.error('Stripe checkout webhook has invalid client_reference_id', {
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

        await logger.error('Unexpected error fetching order for Stripe webhook', {
            eventId: event.id,
            sessionId: session.id,
            orderId,
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
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
        const wasAlreadyPaid = order.status !== 'pending';
        await logger.log('Stripe checkout webhook verified payment status', {
            eventId: event.id,
            sessionId: session.id,
            orderId,
            paymentStatus: session.payment_status,
            nextOrderStatus: status,
            wasAlreadyPaid,
        });

        await updateOrderStatusById(order.id, status);

        const updateData: Record<string, unknown> = {
            paymentProviderSessionId: session.id,
            updatedAt: new Date(),
        };

        const paymentIntentId = toExpandableId(session.payment_intent as string | Stripe.PaymentIntent | null);
        if (paymentIntentId) {
            updateData.paymentProviderOrderId = paymentIntentId;
        }

        if (!order.billingDetails && session.metadata?.billingDetails) {
            try {
                updateData.billingDetails = JSON.parse(session.metadata.billingDetails);
            } catch (parseError) {
                await logger.error('Failed to parse billing details metadata from Stripe webhook', {
                    eventId: event.id,
                    sessionId: session.id,
                    orderId,
                    errorMessage: parseError instanceof Error ? parseError.message : String(parseError),
                    errorStack: parseError instanceof Error ? parseError.stack : undefined,
                });
            }
        }

        const collection = await getCollection<OrderDocument>('orders');
        await collection.updateOne(
            { _id: new (await import('@/lib/db/mongo-client')).ObjectId(order.id) },
            { $set: updateData }
        );

        const updatedOrder = await getOrderById(order.id);
        await logger.log('Stripe checkout webhook order persisted', {
            eventId: event.id,
            sessionId: session.id,
            orderId,
            paymentIntentId,
            orderStatus: updatedOrder.status,
            totalAmount: updatedOrder.totalAmount,
            currency: updatedOrder.currency,
        });

        if (!wasAlreadyPaid && status === 'paid') {
            for (const item of updatedOrder.items) {
                try {
                    const { reduceVariantStock } = await import('@/lib/product/product.service-stock');
                    await reduceVariantStock(item.productId, item.selectedVariantItemIds, item.quantity);
                    await logger.log('Stripe checkout webhook stock reduced', {
                        eventId: event.id,
                        orderId,
                        productId: item.productId,
                        quantity: item.quantity,
                    });
                } catch (stockError) {
                    await logger.error('Failed to reduce stock for paid Stripe webhook order item', {
                        eventId: event.id,
                        sessionId: session.id,
                        orderId,
                        productId: item.productId,
                        errorMessage: stockError instanceof Error ? stockError.message : String(stockError),
                        errorStack: stockError instanceof Error ? stockError.stack : undefined,
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
                await logger.log('Stripe checkout webhook cart cleared after payment', {
                    eventId: event.id,
                    sessionId: session.id,
                    orderId,
                    storefrontSessionId: order.sessionId,
                });
            } catch (clearError) {
                await logger.error('Failed to clear cart after Stripe webhook order payment', {
                    eventId: event.id,
                    sessionId: session.id,
                    orderId,
                    storefrontSessionId: order.sessionId,
                    errorMessage: clearError instanceof Error ? clearError.message : String(clearError),
                    errorStack: clearError instanceof Error ? clearError.stack : undefined,
                });
            }
        }
    } catch (error) {
        await logger.error('Error processing checkout.session.completed', {
            eventId: event.id,
            sessionId: session.id,
            orderId,
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
        });
        return webhookError(
            500,
            'CHECKOUT_SESSION_COMPLETED_PROCESSING_FAILED',
            'Error processing checkout.session.completed webhook',
            { eventId: event.id, sessionId: session.id, orderId }
        );
    }

    return null;
}

async function getOrderDocumentByPaymentIntentId(paymentIntentId: string): Promise<OrderDocument | null> {
    const collection = await getCollection<OrderDocument>('orders');
    return collection.findOne({ paymentProviderOrderId: paymentIntentId });
}

async function handleRefundLifecycleEvent(event: Stripe.Event): Promise<void> {
    const refund = event.data.object as Stripe.Refund;
    const paymentIntentId = toExpandableId(refund.payment_intent as string | Stripe.PaymentIntent | null);

    if (!paymentIntentId) {
        await logger.error('Stripe refund webhook missing payment_intent reference', {
            eventId: event.id,
            eventType: event.type,
            refundId: refund.id,
        });
        return;
    }

    const orderDoc = await getOrderDocumentByPaymentIntentId(paymentIntentId);
    if (!orderDoc) {
        await logger.error('Stripe refund webhook order not found by paymentProviderOrderId', {
            eventId: event.id,
            eventType: event.type,
            refundId: refund.id,
            paymentIntentId,
        });
        return;
    }

    const collection = await getCollection<OrderDocument>('orders');
    const now = new Date();
    const requestedAt = refund.created ? new Date(refund.created * 1000) : now;
    const normalizedRefundStatus = mapRefundStatus(refund.status);

    const updateSet: Record<string, unknown> = {
        'refund.provider': 'stripe',
        'refund.status': normalizedRefundStatus,
        'refund.externalRefundId': refund.id,
        'refund.requestedAt': requestedAt,
        'updatedAt': now,
    };

    if (typeof refund.amount === 'number') {
        updateSet['refund.amount'] = toMajorUnitAmount(refund.amount, refund.currency);
    }

    if (refund.currency) {
        updateSet['refund.currency'] = refund.currency;
    }

    const updateUnset: Record<string, ''> = {};

    if (event.type === 'refund.failed') {
        const orderId = orderDoc._id.toHexString();
        await updateOrderStatusById(orderId, 'refund_failed', { allowWorkflowStatuses: true });
        await logger.error('Stripe refund webhook marked order as refund_failed', {
            eventId: event.id,
            eventType: event.type,
            orderId,
            refundId: refund.id,
            paymentIntentId,
            failureCode: refund.failure_reason ?? 'unknown',
        });
        
        updateSet['refund.status'] = 'failed';
        updateSet['refund.processedAt'] = now;
        updateSet['refund.failureCode'] = refund.failure_reason ?? 'unknown';
        updateSet['refund.failureMessage'] = refund.failure_reason
            ? `Stripe refund failed: ${refund.failure_reason}`
            : 'Stripe refund failed';
    } else {
        updateUnset['refund.failureCode'] = '';
        updateUnset['refund.failureMessage'] = '';
        if (normalizedRefundStatus === 'succeeded') {
            updateSet['refund.processedAt'] = now;
        }
    }

    await collection.updateOne(
        { _id: orderDoc._id },
        {
            $set: updateSet,
            ...(Object.keys(updateUnset).length > 0 ? { $unset: updateUnset } : {}),
        },
    );
    await logger.log('Stripe refund webhook reconciled refund state', {
        eventId: event.id,
        eventType: event.type,
        orderId: orderDoc._id.toHexString(),
        refundId: refund.id,
        paymentIntentId,
        refundStatus: updateSet['refund.status'],
    });
}

async function handleChargeRefunded(event: Stripe.Event): Promise<void> {
    const charge = event.data.object as Stripe.Charge;
    const paymentIntentId = toExpandableId(charge.payment_intent as string | Stripe.PaymentIntent | null);

    if (!paymentIntentId) {
        await logger.error('Stripe charge.refunded webhook missing payment_intent reference', {
            eventId: event.id,
            chargeId: charge.id,
        });
        return;
    }

    const orderDoc = await getOrderDocumentByPaymentIntentId(paymentIntentId);
    if (!orderDoc) {
        await logger.error('Stripe charge.refunded order not found by paymentProviderOrderId', {
            eventId: event.id,
            chargeId: charge.id,
            paymentIntentId,
        });
        return;
    }

    const isFullyRefunded = charge.refunded || (
        typeof charge.amount_refunded === 'number'
        && typeof charge.amount === 'number'
        && charge.amount_refunded >= charge.amount
    );

    const now = new Date();
    const collection = await getCollection<OrderDocument>('orders');
    const updateSet: Record<string, unknown> = {
        'refund.provider': 'stripe',
        'refund.status': isFullyRefunded ? 'succeeded' : 'pending',
        'refund.amount': toMajorUnitAmount(charge.amount_refunded, charge.currency),
        'refund.currency': charge.currency,
        'updatedAt': now,
    };

    const refundData = charge.refunds?.data;
    if (Array.isArray(refundData) && refundData.length > 0 && refundData[0].id) {
        updateSet['refund.externalRefundId'] = refundData[0].id;
    }

    const updateUnset: Record<string, ''> = {
        'refund.failureCode': '',
        'refund.failureMessage': '',
    };

    if (isFullyRefunded) {
        updateSet['refund.processedAt'] = now;

        const refundableStatuses: OrderStatus[] = ['cancellation_approved', 'refund_approved', 'refund_failed'];
        if (refundableStatuses.includes(orderDoc.status)) {
            await updateOrderStatusById(orderDoc._id.toHexString(), 'refunded', { allowWorkflowStatuses: true });
            if (!orderDoc.cancellation?.completedAt) {
                updateSet['cancellation.completedAt'] = now;
            }
            if (!orderDoc.returnRequest?.completedAt) {
                updateSet['returnRequest.completedAt'] = now;
            }
        }
    }

    await collection.updateOne(
        { _id: orderDoc._id },
        {
            $set: updateSet,
            $unset: updateUnset,
        },
    );
    await logger.log('Stripe charge.refunded webhook reconciled order refund completion', {
        eventId: event.id,
        chargeId: charge.id,
        orderId: orderDoc._id.toHexString(),
        paymentIntentId,
        isFullyRefunded,
        resultingRefundStatus: updateSet['refund.status'],
    });
}

async function POSTHandler(req: NextRequest) {
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
        await logger.error('Stripe webhook signature verification failed', {
            errorMessage: err?.message ?? 'Invalid signature',
        });
        return webhookError(400, 'INVALID_STRIPE_SIGNATURE', `Webhook Error: ${err?.message ?? 'Invalid signature'}`);
    }

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const errorResponse = await handleCheckoutSessionCompleted(event);
                if (errorResponse) {
                    return errorResponse;
                }
                break;
            }
            case 'refund.created':
            case 'refund.updated':
            case 'refund.failed':
                await handleRefundLifecycleEvent(event);
                break;
            case 'charge.refunded':
                await handleChargeRefunded(event);
                break;
            default:
                return NextResponse.json({ received: true });
        }
    } catch (error) {
        await logger.error('Error processing Stripe webhook event', {
            eventId: event.id,
            eventType: event.type,
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
        });

        return webhookError(
            500,
            'STRIPE_WEBHOOK_PROCESSING_FAILED',
            `Error processing ${event.type} webhook`,
            { eventId: event.id, eventType: event.type },
        );
    }

    return NextResponse.json({ received: true });
}

export const POST = withRequestLogging(POSTHandler);
