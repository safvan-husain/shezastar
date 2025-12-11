import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { updateOrderStatus, createOrder } from '@/lib/order/order.service';
import { clearCart, getCartBySessionId } from '@/lib/cart/cart.service';
import { OrderDocument, OrderItemDocument } from '@/lib/order/model/order.model';
import { getProduct } from '@/lib/product/product.service';
import { filterImagesByVariants } from '@/lib/product/model/product.model';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is missing.');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {});

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

                // Fetch the cart to populate order items
                const cart = await getCartBySessionId(storefrontSessionId);
                const orderItems: OrderItemDocument[] = [];

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

                const orderData: Omit<OrderDocument, '_id' | 'createdAt' | 'updatedAt'> = {
                    sessionId: storefrontSessionId,
                    stripeSessionId: session.id,
                    items: orderItems,
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
