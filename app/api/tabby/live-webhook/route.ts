import { NextRequest, NextResponse } from 'next/server';

import { clearCart } from '@/lib/cart/cart.service';
import { getCollection, ObjectId } from '@/lib/db/mongo-client';
import type { OrderDocument, OrderStatus } from '@/lib/order/model/order.model';
import { getOrderById, getOrderByPaymentProviderSessionId, updateOrderStatusById } from '@/lib/order/order.service';
import { getStorefrontSessionBySessionId } from '@/lib/storefront-session';
import { withRequestLogging } from '@/lib/logging/request-logger';

const TABBY_API_URL_V2 = 'https://api.tabby.ai/api/v2';
const TABBY_API_URL_V1 = 'https://api.tabby.ai/api/v1';

interface TabbyWebhookPayload {
    id?: string;
}

interface TabbyRefund {
    id?: string;
    amount?: string;
    reference_id?: string;
    created_at?: string;
}

interface TabbyPayment {
    id?: string;
    amount?: string;
    currency?: string;
    status?: string;
    order?: {
        reference_id?: string;
    };
    refunds?: TabbyRefund[];
}

function parseTabbyAmount(amount?: string): number | undefined {
    if (!amount) {
        return undefined;
    }

    const parsed = Number.parseFloat(amount);
    return Number.isFinite(parsed) ? parsed : undefined;
}

async function readResponseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.toLowerCase().includes('application/json')) {
        return response.json().catch(() => undefined);
    }

    return response.text().catch(() => undefined);
}

async function verifyTabbyPayment(paymentId: string, tabbySecretKey: string): Promise<TabbyPayment> {
    const paymentResponse = await fetch(`${TABBY_API_URL_V2}/payments/${paymentId}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${tabbySecretKey}`,
        },
    });

    if (!paymentResponse.ok) {
        const responseBody = await readResponseBody(paymentResponse);
        throw new Error(`Failed to verify Tabby payment ${paymentId}: ${JSON.stringify(responseBody)}`);
    }

    return (await paymentResponse.json()) as TabbyPayment;
}

async function findOrderForPayment(payment: TabbyPayment): Promise<Awaited<ReturnType<typeof getOrderById>> | null> {
    const orderId = payment.order?.reference_id;
    if (orderId) {
        try {
            return await getOrderById(orderId);
        } catch {
            // Fall through to alternate lookup by provider session id.
        }
    }

    if (!payment.id) {
        return null;
    }

    return getOrderByPaymentProviderSessionId(payment.id);
}

async function persistPaidOrder(orderId: string, paymentId: string) {
    const collection = await getCollection<OrderDocument>('orders');
    await collection.updateOne(
        { _id: new ObjectId(orderId) },
        {
            $set: {
                status: 'paid',
                paymentProviderSessionId: paymentId,
                updatedAt: new Date(),
            },
        },
    );
}

async function reduceStockForOrder(order: Awaited<ReturnType<typeof getOrderById>>) {
    for (const item of order.items) {
        try {
            const { reduceVariantStock } = await import('@/lib/product/product.service-stock');
            await reduceVariantStock(item.productId, item.selectedVariantItemIds, item.quantity);
        } catch (stockError) {
            console.error(`Failed to reduce stock for product ${item.productId}:`, stockError);
        }
    }
}

async function clearOrderCart(sessionId: string) {
    const storefrontSession = await getStorefrontSessionBySessionId(sessionId);
    const minimalSession = {
        sessionId,
        status: 'active' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        userId: storefrontSession?.userId,
    };

    try {
        await clearCart(minimalSession);
    } catch {
        // Ignore cart cleanup errors during webhook reconciliation.
    }
}

async function captureAuthorizedPayment(payment: TabbyPayment, order: Awaited<ReturnType<typeof getOrderById>>, tabbySecretKey: string) {
    if (!payment.id || !payment.amount) {
        throw new Error('AUTHORIZED Tabby payment missing id or amount');
    }

    if (order.status !== 'pending') {
        return;
    }

    const captureResponse = await fetch(`${TABBY_API_URL_V1}/payments/${payment.id}/captures`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${tabbySecretKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            amount: payment.amount,
        }),
    });

    if (!captureResponse.ok) {
        const responseBody = await readResponseBody(captureResponse);
        throw new Error(`Capture failed for Tabby payment ${payment.id}: ${JSON.stringify(responseBody)}`);
    }

    await persistPaidOrder(order.id, payment.id);
    const updatedOrder = await getOrderById(order.id);
    await reduceStockForOrder(updatedOrder);
    await clearOrderCart(updatedOrder.sessionId);
}

function getLatestRefund(payment: TabbyPayment): TabbyRefund | undefined {
    const refunds = Array.isArray(payment.refunds) ? payment.refunds : [];
    if (refunds.length === 0) {
        return undefined;
    }

    const sortedRefunds = [...refunds].sort((a, b) => {
        const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bTime - aTime;
    });

    return sortedRefunds[0];
}

async function reconcileRefundState(payment: TabbyPayment, order: Awaited<ReturnType<typeof getOrderById>>) {
    const latestRefund = getLatestRefund(payment);
    if (!latestRefund) {
        return;
    }

    const collection = await getCollection<OrderDocument>('orders');
    const now = new Date();
    const processedAt = latestRefund.created_at ? new Date(latestRefund.created_at) : now;
    const normalizedProcessedAt = Number.isFinite(processedAt.getTime()) ? processedAt : now;

    await collection.updateOne(
        { _id: new ObjectId(order.id) },
        {
            $set: {
                'refund.provider': 'tabby',
                'refund.status': 'succeeded',
                'refund.externalRefundId': latestRefund.id,
                'refund.amount': parseTabbyAmount(latestRefund.amount) ?? order.totalAmount,
                'refund.currency': payment.currency?.toLowerCase() ?? order.currency,
                'refund.processedAt': normalizedProcessedAt,
                'updatedAt': now,
                ...(order.cancellation && !order.cancellation.completedAt ? { 'cancellation.completedAt': now } : {}),
                ...(order.returnRequest && !order.returnRequest.completedAt ? { 'returnRequest.completedAt': now } : {}),
            },
            $unset: {
                'refund.failureCode': '',
                'refund.failureMessage': '',
            },
        },
    );

    const refundableStatuses: OrderStatus[] = [
        'cancellation_approved',
        'refund_approved',
        'refund_failed',
    ];

    if (refundableStatuses.includes(order.status)) {
        await updateOrderStatusById(order.id, 'refunded', { allowWorkflowStatuses: true });
    }
}

async function POSTHandler(req: NextRequest) {
    const tabbySecretKey = process.env.TABBY_SECRET_KEY;

    if (!tabbySecretKey) {
        console.error('TABBY_SECRET_KEY is missing.');
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    try {
        const body = (await req.json()) as TabbyWebhookPayload;
        const paymentId = body.id;

        if (!paymentId) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const payment = await verifyTabbyPayment(paymentId, tabbySecretKey);
        const order = await findOrderForPayment(payment);

        if (!order) {
            console.error(`[Tabby Webhook] No order found for payment ${paymentId}`);
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        if (payment.status === 'AUTHORIZED') {
            await captureAuthorizedPayment(payment, order, tabbySecretKey);
        }

        await reconcileRefundState(payment, order);

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Error handling Tabby webhook:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export const POST = withRequestLogging(POSTHandler);
