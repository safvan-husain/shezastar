import { NextRequest, NextResponse } from 'next/server';
import { updateOrderStatus, createOrder, getOrderByStripeSessionId, getOrderById } from '@/lib/order/order.service';
import { clearCart, getCartBySessionId, getCart } from '@/lib/cart/cart.service';
import { OrderDocument, OrderItemDocument } from '@/lib/order/model/order.model';
import { getProduct } from '@/lib/product/product.service';
import { filterImagesByVariants } from '@/lib/product/model/product.model';
import { AppError } from '@/lib/errors/app-error';
import { getStorefrontSessionBySessionId } from '@/lib/storefront-session';
import { SUPPORTED_CURRENCIES, CurrencyCode } from '@/lib/currency/currency.config';

const TABBY_API_URL_V2 = 'https://api.tabby.ai/api/v2';
const TABBY_API_URL_V1 = 'https://api.tabby.ai/api/v1';

export async function POST(req: NextRequest) {
    const tabbySecretKey = process.env.TABBY_SECRET_KEY;

    if (!tabbySecretKey) {
        console.error('TABBY_SECRET_KEY is missing.');
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    try {
        const body = await req.json();
        // Tabby webhook payload usually contains the payment object or an event wrapper.
        // Based on docs "Webhooks ... authorized", it likely sends the updated payment object.
        // We will assume 'id' is present.

        const paymentId = body.id;
        const status = body.status;

        if (!paymentId) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // Verify by determining the payment status from Tabby API directly
        const paymentResponse = await fetch(`${TABBY_API_URL_V2}/payments/${paymentId}`, {
            headers: {
                'Authorization': `Bearer ${tabbySecretKey}`,
            },
        });

        if (!paymentResponse.ok) {
            console.error('Failed to verify Tabby payment:', await paymentResponse.text());
            return NextResponse.json({ error: 'Verification failed' }, { status: 400 });
        }

        const payment = await paymentResponse.json();

        // Check if authorized
        if (payment.status === 'AUTHORIZED') {
            // We stored orderId in order.reference_id
            const orderId = payment.order.reference_id;
            let order: any = null;

            try {
                order = await getOrderById(orderId);
            } catch (e) {
                console.error(`[Tabby Webhook] Order not found for reference_id: ${orderId}`);
                // Fallback to searching by paymentProviderSessionId if we already updated it once
                const { getOrderByPaymentProviderSessionId } = await import('@/lib/order/order.service');
                order = await getOrderByPaymentProviderSessionId(paymentId);
            }

            if (!order) {
                console.error(`[Tabby Webhook] No order found for payment ${paymentId}`);
                return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            }

            // IDEMPOTENCY GUARD: Only proceed if the order is still 'pending'.
            // This prevents duplicate stock reduction or overwriting manual status changes (e.g., 'completed', 'cancelled').
            if (order.status !== 'pending') {
                console.log(`[Tabby Webhook] Order ${order.id || order._id} status is '${order.status}'. Skipping automated fulfillment.`);
                return NextResponse.json({ received: true });
            }

            // Capture the payment
            console.log(`[Tabby Webhook] Capturing payment ${paymentId} for order ${orderId}`);

            const captureResponse = await fetch(`${TABBY_API_URL_V1}/payments/${paymentId}/captures`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tabbySecretKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: payment.amount, // Capture full amount
                }),
            });

            if (!captureResponse.ok) {
                const errorText = await captureResponse.text();
                console.error(`[Tabby Webhook] Capture failed for ${paymentId}:`, errorText);
                return NextResponse.json({ error: 'Capture failed' }, { status: 500 });
            }

            console.log(`[Tabby Webhook] Payment ${paymentId} captured.`);

            // Update Order Status
            const { getCollection } = await import('@/lib/db/mongo-client');
            const collection = await getCollection<any>('orders');
            await collection.updateOne(
                { _id: order.id ? new (await import('@/lib/db/mongo-client')).ObjectId(order.id) : order._id },
                {
                    $set: {
                        status: 'paid',
                        paymentProviderSessionId: paymentId,
                        updatedAt: new Date()
                    }
                }
            );

            console.log(`[Tabby Webhook] Order ${order.id || order._id} updated to paid for payment ${paymentId}`);

            // Reduce Stock
            // Re-fetch to get full item details from DB
            const updatedOrder = await getOrderById(order.id || order._id.toHexString());
            for (const item of updatedOrder.items) {
                try {
                    const { reduceVariantStock } = await import('@/lib/product/product.service-stock');
                    await reduceVariantStock(item.productId, item.selectedVariantItemIds, item.quantity);
                } catch (stockError) {
                    console.error(`Failed to reduce stock for product ${item.productId}:`, stockError);
                }
            }

            // Clear Cart
            const storefrontSessionId = updatedOrder.sessionId;
            const storefrontSession = await getStorefrontSessionBySessionId(storefrontSessionId);
            const minimalSession = {
                sessionId: storefrontSessionId,
                status: 'active' as const,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                expiresAt: new Date().toISOString(),
                lastActiveAt: new Date().toISOString(),
                userId: storefrontSession?.userId,
            };
            try {
                await clearCart(minimalSession);
            } catch (e) { }
        }

        return NextResponse.json({ received: true });
    } catch (error: any) {
        console.error('Error handling Tabby webhook:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
