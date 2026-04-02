import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { computeCartItemPricing, getCartForCurrentSession } from '@/lib/cart/cart.service';
import type { InstallationOption } from '@/lib/cart/cart.schema';
import { getStorefrontSession } from '@/lib/storefront-session';
import { convertPrice, getExchangeRates } from '@/lib/currency/currency.service';
import { SUPPORTED_CURRENCIES, CurrencyCode } from '@/lib/currency/currency.config';
import { createOrder } from '@/lib/order/order.service';
import { OrderItemDocument } from '@/lib/order/model/order.model';
import {
    computeCheckoutPricingBreakdown,
    resolveCountryPricingForCheckout,
} from '@/lib/checkout/country-pricing.service';
import { getProduct } from '@/lib/product/product.service';
import { filterImagesByVariants } from '@/lib/product/model/product.model';
import { ObjectId } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import { buildCustomerActivityActor, createActivityLog } from '@/lib/activity/activity.service';
import { logger } from '@/lib/logging/logger';
import { withRequestLogging } from '@/lib/logging/request-logger';

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, {})
    : null;

async function POSTHandler(req: NextRequest) {
    if (!stripe) {
        await logger.error('Stripe checkout session creation blocked: missing STRIPE_SECRET_KEY');
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    try {
        const storefrontSession = await getStorefrontSession();
        if (!storefrontSession) {
            return NextResponse.json({ error: 'No active session' }, { status: 401 });
        }
        const sessionId = storefrontSession.sessionId;

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
        const rawCurrency = (typeof body.currency === 'string' && body.currency ? body.currency : 'USD');
        const targetCurrencyCode = rawCurrency.toUpperCase() as CurrencyCode;
        const billingCountryForPricing =
            typeof body.country === 'string' && body.country.trim()
                ? body.country.trim()
                : billingDetails.country;
        if (
            typeof body.country === 'string' &&
            body.country.trim() &&
            billingDetails.country?.trim() &&
            body.country.trim().toUpperCase() !== billingDetails.country.trim().toUpperCase()
        ) {
            return NextResponse.json(
                {
                    error: 'BILLING_COUNTRY_MISMATCH',
                    code: 'BILLING_COUNTRY_MISMATCH',
                    message: 'Billing address country does not match selected country. Please edit the address to update the country.',
                },
                { status: 400 }
            );
        }
        metadata.billingCountry = billingCountryForPricing;

        const rawItems = Array.isArray(body.items) ? body.items : [];
        await logger.log('Stripe checkout session initialization started', {
            paymentProvider: 'stripe',
            sessionId,
            currency: targetCurrencyCode,
            checkoutType: rawItems.length > 0 ? 'buy_now' : 'cart',
            customerEmail: billingDetails.email,
        });

        const rates = await getExchangeRates();
        const currencyConfig = SUPPORTED_CURRENCIES.find(c => c.code === targetCurrencyCode);
        const multiplier = currencyConfig?.decimals === 3 ? 1000 : 100;

        // Prepare items for stock validation
        let itemsToValidate: Array<{ productId: string; selectedVariantItemIds: string[]; quantity: number }> = [];
        let totalAmount = 0;
        let processedBuyNowItems: Array<{
            productId: string;
            selectedVariantItemIds: string[];
            quantity: number;
            installationOption: InstallationOption;
            installationLocationId?: string;
            installationLocationDelta?: number;
            installationAddOnPrice: number;
            unitPrice: number;
        }> = [];

        if (rawItems.length > 0) {

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
                await logger.error('Stripe checkout session initialization failed: invalid buy now payload', {
                    paymentProvider: 'stripe',
                    sessionId,
                    currency: targetCurrencyCode,
                });
                return NextResponse.json({ error: 'Invalid buy now payload' }, { status: 400 });
            }

            itemsToValidate = processedBuyNowItems.map((item) => ({
                productId: item.productId,
                selectedVariantItemIds: item.selectedVariantItemIds,
                quantity: item.quantity,
            }));

            lineItems = processedBuyNowItems.map((item) => {
                const convertedPrice = convertPrice(item.unitPrice, targetCurrencyCode, rates);
                return {
                    price_data: {
                        currency: targetCurrencyCode.toLowerCase(),
                        product_data: {
                            name: item.productId,
                        },
                        unit_amount: Math.round(convertedPrice * multiplier),
                    },
                    quantity: item.quantity,
                };
            });

            metadata.type = 'buy_now';
            metadata.buyNowItems = JSON.stringify(processedBuyNowItems);
        } else {
            // Standard Cart Flow
            if (!cart || cart.items.length === 0) {
                return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
            }

            // Recalculate prices to ensure freshness (handle price changes/offers)
            const freshCartItems = [];
            for (const item of cart.items) {
                try {
                    const pricing = await computeCartItemPricing(
                        item.productId,
                        item.selectedVariantItemIds,
                        item.installationOption,
                        item.installationLocationId
                    );
                    freshCartItems.push({
                        ...item,
                        unitPrice: pricing.unitPrice, // Use fresh price
                    });
                } catch (error) {
                    await logger.error('Stripe checkout pricing refresh failed', {
                        paymentProvider: 'stripe',
                        sessionId,
                        productId: item.productId,
                        errorMessage: error instanceof Error ? error.message : String(error),
                        errorStack: error instanceof Error ? error.stack : undefined,
                    });
                    // If product deleted or error, we might want to skip or fail. 
                    // For now, fail to prevent incorrect charges.
                    return NextResponse.json({ error: `Product ${item.productId} unavailable` }, { status: 400 });
                }
            }

            itemsToValidate = freshCartItems.map(item => ({
                productId: item.productId,
                selectedVariantItemIds: item.selectedVariantItemIds,
                quantity: item.quantity
            }));

            totalAmount = freshCartItems.reduce((sum, item) => {
                const convertedPrice = convertPrice(item.unitPrice, targetCurrencyCode, rates);
                return sum + (convertedPrice * item.quantity);
            }, 0);

            lineItems = freshCartItems.map((item) => {
                const convertedPrice = convertPrice(item.unitPrice, targetCurrencyCode, rates);
                const finalAmount = Math.round(convertedPrice * multiplier);

                return {
                    price_data: {
                        currency: targetCurrencyCode.toLowerCase(),
                        product_data: {
                            name: item.productId,
                        },
                        unit_amount: finalAmount,
                    },
                    quantity: item.quantity,
                };
            });
        }

        // Preparation for Order Persistence
        const orderItems: OrderItemDocument[] = [];
        const itemsToProcess = rawItems.length > 0 ? processedBuyNowItems : cart.items.map(item => {
            // Find the fresh price we calculated
            const fresh = (rawItems.length > 0 ? [] : (lineItems as any)).find((li: any) => li.price_data.product_data.name === item.productId);
            // Wait, mapping from lineItems is messy. Let's use the actual items we processed.
            return item;
        });

        // RE-FETCH or use processed items to build orderItems
        // Actually, let's use a cleaner way to get orderItems for both flows.
        const sourceItems = rawItems.length > 0 ? processedBuyNowItems : (await Promise.all(cart.items.map(async item => {
            const pricing = await computeCartItemPricing(item.productId, item.selectedVariantItemIds, item.installationOption, item.installationLocationId);
            return { ...item, unitPrice: pricing.unitPrice };
        })));

        for (const item of sourceItems) {
            try {
                const product = await getProduct(item.productId);
                let productImage = product.images.length > 0 ? product.images[0].url : undefined;
                if (item.selectedVariantItemIds.length > 0) {
                    const matchedImages = filterImagesByVariants(product.images, item.selectedVariantItemIds);
                    if (matchedImages.length > 0) productImage = matchedImages[0].url;
                }

                let variantNames: string[] = [];
                for (const variant of product.variants) {
                    for (const vItem of variant.selectedItems) {
                        if (item.selectedVariantItemIds.includes(vItem.id)) {
                            variantNames.push(`${variant.variantTypeName}: ${vItem.name}`);
                        }
                    }
                }
                const variantName = variantNames.length > 0 ? variantNames.join(', ') : undefined;

                let installationLocationName: string | undefined;
                if (item.installationLocationId && product.installationService?.availableLocations) {
                    const loc = product.installationService.availableLocations.find(l => l.locationId === item.installationLocationId);
                    if (loc) installationLocationName = loc.name;
                }

                orderItems.push({
                    productId: item.productId,
                    productName: product.name,
                    productImage,
                    variantName,
                    selectedVariantItemIds: item.selectedVariantItemIds,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    installationOption: item.installationOption,
                    installationAddOnPrice: (item as any).installationAddOnPrice ?? 0,
                    installationLocationId: item.installationLocationId,
                    installationLocationName,
                    installationLocationDelta: (item as any).installationLocationDelta ?? 0,
                });
            } catch (error) {
                await logger.error('Stripe checkout order item enrichment failed', {
                    paymentProvider: 'stripe',
                    sessionId,
                    productId: item.productId,
                    errorMessage: error instanceof Error ? error.message : String(error),
                    errorStack: error instanceof Error ? error.stack : undefined,
                });
                orderItems.push({
                    productId: item.productId,
                    productName: 'Unknown Product',
                    selectedVariantItemIds: item.selectedVariantItemIds,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    installationOption: item.installationOption,
                });
            }
        }

        const totalAmountCalculated = sourceItems.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0);
        const countryPricing = await resolveCountryPricingForCheckout(billingCountryForPricing);
        const pricingBreakdown = computeCheckoutPricingBreakdown({
            subtotalAed: totalAmountCalculated,
            currency: targetCurrencyCode,
            rates,
            countryPricing,
        });

        if (pricingBreakdown.shipping > 0) {
            lineItems.push({
                price_data: {
                    currency: targetCurrencyCode.toLowerCase(),
                    product_data: {
                        name: `Shipping (${countryPricing.code})`,
                    },
                    unit_amount: Math.round(pricingBreakdown.shipping * multiplier),
                },
                quantity: 1,
            });
        }

        if (pricingBreakdown.vat > 0) {
            lineItems.push({
                price_data: {
                    currency: targetCurrencyCode.toLowerCase(),
                    product_data: {
                        name: `VAT (${pricingBreakdown.vatRatePercent}%)`,
                    },
                    unit_amount: Math.round(pricingBreakdown.vat * multiplier),
                },
                quantity: 1,
            });
        }

        // Create the PENDING order
        const pendingOrder = await createOrder({
            sessionId,
            paymentProvider: 'stripe',
            items: orderItems,
            subtotalAmount: pricingBreakdown.subtotal,
            shippingAmount: pricingBreakdown.shipping,
            vatAmount: pricingBreakdown.vat,
            vatRatePercent: pricingBreakdown.vatRatePercent,
            vatIncludedInPrice: pricingBreakdown.vatIncludedInPrice,
            countryCode: pricingBreakdown.countryCode,
            totalAmount: pricingBreakdown.total,
            currency: targetCurrencyCode.toLowerCase(),
            status: 'pending',
            billingDetails: billingDetails,
            userId: storefrontSession.userId ? new ObjectId(storefrontSession.userId) : undefined,
        });

        await logger.log('Stripe pending order created before checkout session', {
            paymentProvider: 'stripe',
            orderId: pendingOrder.id,
            sessionId,
            totalAmount: pendingOrder.totalAmount,
            currency: pendingOrder.currency,
            itemCount: pendingOrder.items.length,
            shippingAmount: pendingOrder.shippingAmount,
            vatAmount: pendingOrder.vatAmount,
            countryCode: pendingOrder.countryCode,
        });

        await createActivityLog({
            actionType: 'order.created',
            actor: buildCustomerActivityActor({
                sessionId,
                userId: storefrontSession.userId,
                displayName: billingName || billingDetails.email,
            }),
            primaryEntity: {
                kind: 'order',
                id: pendingOrder.id,
                label: `Order #${pendingOrder.id.slice(0, 8)}`,
            },
            relatedEntities: pendingOrder.items.map((item) => ({
                kind: 'product',
                id: item.productId,
                label: item.productName,
            })),
            summary: `${billingName || billingDetails.email || 'Customer'} created order #${pendingOrder.id.slice(0, 8)}`,
            details: {
                paymentProvider: pendingOrder.paymentProvider,
                status: pendingOrder.status,
                totalAmount: pendingOrder.totalAmount,
                currency: pendingOrder.currency,
                itemCount: pendingOrder.items.length,
            },
        });

        metadata.orderId = pendingOrder.id;
        metadata.countryCode = pricingBreakdown.countryCode;
        metadata.subtotalAmount = pricingBreakdown.subtotal.toString();
        metadata.shippingAmount = pricingBreakdown.shipping.toString();
        metadata.vatAmount = pricingBreakdown.vat.toString();
        metadata.vatRatePercent = pricingBreakdown.vatRatePercent.toString();
        metadata.vatIncludedInPrice = String(pricingBreakdown.vatIncludedInPrice);

        // Validate stock availability before creating checkout session
        const { validateStockAvailability } = await import('@/lib/product/product.service-stock');
        const stockValidation = await validateStockAvailability(itemsToValidate);

        if (!stockValidation.available) {
            await logger.error('Stripe checkout stock validation failed', {
                paymentProvider: 'stripe',
                orderId: pendingOrder.id,
                sessionId,
                details: stockValidation.insufficientItems,
            });
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
            client_reference_id: pendingOrder.id,
            success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/checkout/cancel`,
            metadata: metadata,
        });

        await logger.log('Stripe checkout session created', {
            paymentProvider: 'stripe',
            orderId: pendingOrder.id,
            sessionId,
            checkoutSessionId: session.id,
            totalAmount: pendingOrder.totalAmount,
            currency: pendingOrder.currency,
        });

        return NextResponse.json({ url: session.url });
    } catch (err: any) {
        await logger.error('Stripe checkout session creation failed', {
            paymentProvider: 'stripe',
            errorMessage: err instanceof Error ? err.message : String(err),
            errorStack: err instanceof Error ? err.stack : undefined,
            details: err instanceof AppError ? err.details : undefined,
        });
        if (err instanceof AppError) {
            return NextResponse.json(
                { error: err.code, code: err.code, message: err.details?.message || err.message, details: err.details },
                { status: err.status }
            );
        }
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export const POST = withRequestLogging(POSTHandler);
