import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateOrderStatus, createOrder } from '@/lib/order/order.service';
import { clearCart, getCartBySessionId } from '@/lib/cart/cart.service';
import { OrderDocument, OrderItemDocument } from '@/lib/order/model/order.model';
import { getProduct } from '@/lib/product/product.service';
import { filterImagesByVariants } from '@/lib/product/model/product.model';

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-11-17.clover'
    })
    : null;

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
    if (!endpointSecret || !stripe) {
        return NextResponse.json({ error: 'Webhook secret or Stripe key not configured' }, { status: 500 });
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
                const orderItems: OrderItemDocument[] = [];
                let shouldClearCart = true;

                // Check for Buy Now items in metadata
                if (session.metadata?.type === 'buy_now' && session.metadata?.buyNowItems) {
                    try {
                        const buyNowItems = JSON.parse(session.metadata.buyNowItems);
                        // Loop through Buy Now items
                        for (const item of buyNowItems) {
                            try {
                                const product = await getProduct(item.productId);

                                // Resolve Product Image
                                let productImage = product.images.length > 0 ? product.images[0].url : undefined;
                                if (item.selectedVariantItemIds && item.selectedVariantItemIds.length > 0) {
                                    const matchedImages = filterImagesByVariants(product.images, item.selectedVariantItemIds);
                                    if (matchedImages.length > 0) {
                                        productImage = matchedImages[0].url;
                                    }
                                }

                                // Resolve Variant Name
                                let variantNames: string[] = [];
                                if (item.selectedVariantItemIds && item.selectedVariantItemIds.length > 0) {
                                    for (const variant of product.variants) {
                                        for (const vItem of variant.selectedItems) {
                                            if (item.selectedVariantItemIds.includes(vItem.id)) {
                                                variantNames.push(`${variant.variantTypeName}: ${vItem.name}`);
                                            }
                                        }
                                    }
                                }
                                const variantName = variantNames.length > 0 ? variantNames.join(', ') : undefined;

                                orderItems.push({
                                    productId: item.productId,
                                    productName: product.name,
                                    productImage: productImage,
                                    variantName: variantName,
                                    selectedVariantItemIds: item.selectedVariantItemIds || [],
                                    quantity: item.quantity,
                                    unitPrice: item.unitPrice,
                                });
                            } catch (err) {
                                console.error(`Failed to fetch product details for buy now product ${item.productId}`, err);
                                orderItems.push({
                                    productId: item.productId,
                                    productName: 'Unknown Product',
                                    selectedVariantItemIds: item.selectedVariantItemIds || [],
                                    quantity: item.quantity,
                                    unitPrice: item.unitPrice,
                                });
                            }
                        }
                        shouldClearCart = false; // Don't clear cart for Buy Now
                    } catch (e) {
                        console.error('Failed to parse buy now items', e);
                    }
                } else {
                    // Standard Cart Flow
                    const cart = await getCartBySessionId(storefrontSessionId);

                    if (cart && cart.items.length > 0) {
                        // Loop through ALL items in the cart
                        for (const cartItem of cart.items) {
                            try {
                                const product = await getProduct(cartItem.productId);

                                // Resolve Product Image
                                // Use the first image that matches the variant or default to first product image
                                let productImage = product.images.length > 0 ? product.images[0].url : undefined;
                                if (cartItem.selectedVariantItemIds.length > 0) {
                                    const matchedImages = filterImagesByVariants(product.images, cartItem.selectedVariantItemIds);
                                    if (matchedImages.length > 0) {
                                        productImage = matchedImages[0].url;
                                    }
                                }

                                // Resolve Variant Name
                                let variantNames: string[] = [];
                                if (cartItem.selectedVariantItemIds.length > 0) {
                                    for (const variant of product.variants) {
                                        for (const item of variant.selectedItems) {
                                            if (cartItem.selectedVariantItemIds.includes(item.id)) {
                                                variantNames.push(`${variant.variantTypeName}: ${item.name}`);
                                            }
                                        }
                                    }
                                }
                                const variantName = variantNames.length > 0 ? variantNames.join(', ') : undefined;

                                orderItems.push({
                                    productId: cartItem.productId,
                                    productName: product.name,
                                    productImage: productImage,
                                    variantName: variantName,
                                    selectedVariantItemIds: cartItem.selectedVariantItemIds,
                                    quantity: cartItem.quantity,
                                    unitPrice: cartItem.unitPrice,
                                });
                            } catch (err) {
                                console.error(`Failed to fetch product details for product ${cartItem.productId} in session ${storefrontSessionId}`, err);
                                // Fallback if product not found (should be rare)
                                orderItems.push({
                                    productId: cartItem.productId,
                                    productName: 'Unknown Product', // Placeholder
                                    selectedVariantItemIds: cartItem.selectedVariantItemIds,
                                    quantity: cartItem.quantity,
                                    unitPrice: cartItem.unitPrice,
                                });
                            }
                        }
                    }
                }

                const orderData: Omit<OrderDocument, '_id' | 'createdAt' | 'updatedAt'> = {
                    sessionId: storefrontSessionId,
                    stripeSessionId: session.id,
                    items: orderItems,
                    totalAmount: session.amount_total ? session.amount_total / 100 : 0,
                    currency: session.currency || 'usd',
                    status: status,
                };

                await createOrder(orderData);

                // Reduce stock for each item after successful order creation
                for (const item of orderItems) {
                    try {
                        const { reduceVariantStock } = await import('@/lib/product/product.service-stock');
                        await reduceVariantStock(item.productId, item.selectedVariantItemIds, item.quantity);
                        console.log(`Reduced stock for product ${item.productId}, variant ${item.selectedVariantItemIds.join('+')}, quantity ${item.quantity}`);
                    } catch (stockError) {
                        // Log error but don't fail the order
                        console.error(`Failed to reduce stock for product ${item.productId}:`, stockError);
                        // TODO: Consider adding to a queue for manual review
                    }
                }

                // Clear the cart ONLY if it's not a Buy Now order
                if (shouldClearCart) {
                    await clearCart(storefrontSessionId);
                    console.log(`Order created and cart cleared for session ${storefrontSessionId}`);
                } else {
                    console.log(`Order created (Buy Now) for session ${storefrontSessionId}. Cart preserved.`);
                }
            } catch (error) {
                console.error('Error processing checkout.session.completed:', error);
                return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 });
            }
        }
    }

    return NextResponse.json({ received: true });
}
