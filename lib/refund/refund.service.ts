import { enforceServerOnly } from '@/lib/utils/server-only';

import Stripe from 'stripe';
import { AppError } from '@/lib/errors/app-error';
import { SUPPORTED_CURRENCIES } from '@/lib/currency/currency.config';
import { logger } from '@/lib/logging/logger';
import type { Order, OrderRefundDocument } from '@/lib/order/model/order.model';

const TABBY_API_URL_V2 = 'https://api.tabby.ai/api/v2';

export interface RefundQueueResult {
    queued: boolean;
    code: 'REFUND_CREATED' | 'SKIPPED_PROVIDER';
    provider?: 'stripe' | 'tabby';
    externalRefundId?: string;
    requestedAt?: Date;
    amount?: number;
    currency?: string;
    succeeded?: boolean;
}

export function buildPendingRefundFromOrder(order: Pick<Order, 'paymentProvider' | 'totalAmount' | 'currency'>): OrderRefundDocument {
    return {
        status: 'pending',
        provider: order.paymentProvider,
        amount: order.totalAmount,
        currency: order.currency,
        requestedAt: new Date(),
    };
}

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-11-17.clover',
    })
    : null;

function resolveCurrencyDecimals(currency?: string): number {
    if (!currency) {
        return 2;
    }

    const config = SUPPORTED_CURRENCIES.find((item) => item.code === currency.toUpperCase());
    return config?.decimals ?? 2;
}

function formatAmountForCurrency(amount: number, currency?: string): string {
    return amount.toFixed(resolveCurrencyDecimals(currency));
}

async function readResponseBody(response: Response): Promise<unknown> {
    const contentType = response.headers.get('content-type') ?? '';

    if (contentType.toLowerCase().includes('application/json')) {
        return response.json().catch(() => undefined);
    }

    const textBody = await response.text().catch(() => '');
    if (!textBody) {
        return undefined;
    }

    try {
        return JSON.parse(textBody) as unknown;
    } catch {
        return textBody;
    }
}

function toMajorUnitAmount(amount: number, currency?: string): number {
    if (!currency) {
        return amount / 100;
    }

    const normalizedCurrency = currency.toUpperCase();
    const config = SUPPORTED_CURRENCIES.find((item) => item.code === normalizedCurrency);
    const decimals = config?.decimals ?? 2;
    return amount / (10 ** decimals);
}

async function resolvePaymentIntentId(order: Order): Promise<string | undefined> {
    if (order.paymentProviderOrderId) {
        return order.paymentProviderOrderId;
    }

    const checkoutSessionId = order.paymentProviderSessionId ?? order.stripeSessionId;
    if (!checkoutSessionId) {
        return undefined;
    }

    if (!stripe) {
        throw new AppError(500, 'STRIPE_CONFIG_MISSING', {
            message: 'STRIPE_SECRET_KEY is required for Stripe refund initiation',
        });
    }

    const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId);
    if (!checkoutSession.payment_intent) {
        return undefined;
    }

    if (typeof checkoutSession.payment_intent === 'string') {
        return checkoutSession.payment_intent;
    }

    return checkoutSession.payment_intent.id;
}

interface TabbyRefund {
    id?: string;
    amount?: string;
    reference_id?: string;
    created_at?: string;
}

interface TabbyPaymentResponse {
    id?: string;
    status?: string;
    currency?: string;
    refunds?: TabbyRefund[];
}

interface TabbyRefundResponse {
    currency?: string;
    refunds?: TabbyRefund[];
}

function resolveTabbyPaymentId(order: Order): string | undefined {
    return order.paymentProviderSessionId ?? order.paymentProviderOrderId;
}

function buildRefundReason(order: Order): string {
    const requestReason = order.returnRequest?.requestReason?.trim()
        || order.cancellation?.requestReason?.trim();
    return requestReason && requestReason.length > 0
        ? requestReason
        : 'Admin approved order refund';
}

async function closeTabbyPayment(
    paymentId: string,
    tabbySecretKey: string,
    orderId: string,
): Promise<TabbyPaymentResponse> {
    const closeResponse = await fetch(`${TABBY_API_URL_V2}/payments/${paymentId}/close`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${tabbySecretKey}`,
        },
    });

    const closeResponseBody = await readResponseBody(closeResponse);
    if (!closeResponse.ok) {
        throw new AppError(closeResponse.status, 'TABBY_PAYMENT_CLOSE_FAILED', {
            orderId,
            paymentId,
            response: closeResponseBody,
        });
    }

    await logger.log('Tabby payment closed before refund processing', {
        paymentProvider: 'tabby',
        orderId,
        paymentId,
    });

    return (closeResponseBody as TabbyPaymentResponse | undefined) ?? {};
}

async function ensureTabbyPaymentClosed(
    paymentId: string,
    tabbySecretKey: string,
    orderId: string,
): Promise<TabbyPaymentResponse> {
    const paymentStatusResponse = await fetch(`${TABBY_API_URL_V2}/payments/${paymentId}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${tabbySecretKey}`,
        },
    });

    const paymentStatusBody = await readResponseBody(paymentStatusResponse);
    if (!paymentStatusResponse.ok) {
        throw new AppError(paymentStatusResponse.status, 'TABBY_PAYMENT_LOOKUP_FAILED', {
            orderId,
            paymentId,
            response: paymentStatusBody,
        });
    }

    const payment = paymentStatusBody as TabbyPaymentResponse | undefined;
    if (payment?.status === 'CLOSED') {
        await logger.debug('Tabby payment already closed before refund processing', {
            paymentProvider: 'tabby',
            orderId,
            paymentId,
        });
        return payment;
    }

    await logger.log('Tabby payment requires close before refund processing', {
        paymentProvider: 'tabby',
        orderId,
        paymentId,
        paymentStatus: payment?.status ?? 'unknown',
    });
    return closeTabbyPayment(paymentId, tabbySecretKey, orderId);
}

function normalizeTabbyRefundResult(params: {
    order: Order;
    currency?: string;
    refunds?: TabbyRefund[];
    referenceId: string;
    fallbackRequestedAt?: Date;
    fallbackAmount?: number;
}): RefundQueueResult {
    const refunds = Array.isArray(params.refunds) ? params.refunds : [];
    const matchedRefund = refunds.find((item) => item.reference_id === params.referenceId) ?? refunds.at(-1);
    const requestedAt = matchedRefund?.created_at ? new Date(matchedRefund.created_at) : params.fallbackRequestedAt ?? new Date();
    const hasValidRequestedAt = Number.isFinite(requestedAt.getTime());
    const normalizedRequestedAt = hasValidRequestedAt ? requestedAt : new Date();
    const parsedRefundAmount = matchedRefund?.amount ? Number.parseFloat(matchedRefund.amount) : Number.NaN;
    const normalizedAmount = Number.isFinite(parsedRefundAmount)
        ? parsedRefundAmount
        : params.fallbackAmount ?? params.order.totalAmount;
    const normalizedCurrency = params.currency
        ? params.currency.toLowerCase()
        : params.order.currency;

    return {
        queued: true,
        code: 'REFUND_CREATED',
        provider: 'tabby',
        externalRefundId: matchedRefund?.id,
        requestedAt: normalizedRequestedAt,
        amount: normalizedAmount,
        currency: normalizedCurrency,
        succeeded: Boolean(matchedRefund?.id),
    };
}

async function createTabbyRefundForOrder(
    order: Order,
    paymentId: string,
    tabbySecretKey: string,
): Promise<RefundQueueResult> {
    const amount = formatAmountForCurrency(order.totalAmount, order.currency);
    const referenceId = order.id;
    const refundPayload = {
        amount,
        reference_id: referenceId,
        reason: buildRefundReason(order),
        // Full-refund only: send a single summary line that equals total order amount.
        items: [
            {
                title: `Order #${order.id}`,
                quantity: 1,
                unit_price: amount,
                category: 'General',
                reference_id: order.id,
            },
        ],
    };

    const refundResponse = await fetch(`${TABBY_API_URL_V2}/payments/${paymentId}/refunds`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${tabbySecretKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(refundPayload),
    });

    const refundResponseBody = await readResponseBody(refundResponse);
    if (!refundResponse.ok) {
        throw new AppError(refundResponse.status, 'TABBY_REFUND_FAILED', {
            orderId: order.id,
            paymentId,
            request: refundPayload,
            response: refundResponseBody,
        });
    }

    const tabbyRefundResponse = refundResponseBody as TabbyRefundResponse | undefined;
    await logger.log('Tabby refund initiated', {
        orderId: order.id,
        paymentId,
        paymentProvider: 'tabby',
        refundReferenceId: referenceId,
        refundId: tabbyRefundResponse?.refunds?.at(-1)?.id,
        totalAmount: order.totalAmount,
        currency: order.currency,
    });

    return normalizeTabbyRefundResult({
        order,
        currency: tabbyRefundResponse?.currency,
        refunds: tabbyRefundResponse?.refunds,
        referenceId,
    });
}

async function queueTabbyRefundForOrder(order: Order): Promise<RefundQueueResult> {
    const tabbySecretKey = process.env.TABBY_SECRET_KEY;

    if (!tabbySecretKey) {
        throw new AppError(500, 'TABBY_CONFIG_MISSING', {
            orderId: order.id,
            message: 'TABBY_SECRET_KEY is required for Tabby refund initiation',
        });
    }

    const paymentId = resolveTabbyPaymentId(order);
    if (!paymentId) {
        throw new AppError(409, 'PAYMENT_PROVIDER_ORDER_ID_MISSING', {
            orderId: order.id,
            paymentProvider: order.paymentProvider,
        });
    }

    await ensureTabbyPaymentClosed(paymentId, tabbySecretKey, order.id);
    return createTabbyRefundForOrder(order, paymentId, tabbySecretKey);
}

export async function queueRefundForOrder(order: Order): Promise<RefundQueueResult> {
    if (order.paymentProvider === 'tabby') {
        return queueTabbyRefundForOrder(order);
    }

    if (order.paymentProvider !== 'stripe') {
        await logger.debug('Refund initiation skipped for unsupported provider', {
            orderId: order.id,
            paymentProvider: order.paymentProvider,
        });

        return {
            queued: false,
            code: 'SKIPPED_PROVIDER',
            provider: order.paymentProvider,
        };
    }

    if (!stripe) {
        throw new AppError(500, 'STRIPE_CONFIG_MISSING', {
            orderId: order.id,
            message: 'STRIPE_SECRET_KEY is required for Stripe refund initiation',
        });
    }

    const paymentIntentId = await resolvePaymentIntentId(order);
    if (!paymentIntentId) {
        throw new AppError(409, 'PAYMENT_PROVIDER_ORDER_ID_MISSING', {
            orderId: order.id,
            paymentProvider: order.paymentProvider,
        });
    }

    const stripeRefund = await stripe.refunds.create(
        {
            payment_intent: paymentIntentId,
        },
        {
            idempotencyKey: `order-refund:${order.id}`,
        },
    );

    const requestedAt = stripeRefund.created
        ? new Date(stripeRefund.created * 1000)
        : new Date();

    await logger.log('Stripe refund initiated', {
        orderId: order.id,
        paymentIntentId,
        paymentProvider: 'stripe',
        refundId: stripeRefund.id,
        refundStatus: stripeRefund.status,
        totalAmount: order.totalAmount,
        currency: order.currency,
    });

    return {
        queued: true,
        code: 'REFUND_CREATED',
        provider: 'stripe',
        externalRefundId: stripeRefund.id,
        requestedAt,
        amount: toMajorUnitAmount(stripeRefund.amount, stripeRefund.currency),
        currency: stripeRefund.currency,
    };
}

export async function queueRefundForApprovedCancellation(order: Order): Promise<RefundQueueResult> {
    if (order.paymentProvider === 'tabby') {
        const tabbySecretKey = process.env.TABBY_SECRET_KEY;

        if (!tabbySecretKey) {
            throw new AppError(500, 'TABBY_CONFIG_MISSING', {
                orderId: order.id,
                message: 'TABBY_SECRET_KEY is required for Tabby cancellation handling',
            });
        }

        const paymentId = resolveTabbyPaymentId(order);
        if (!paymentId) {
            throw new AppError(409, 'PAYMENT_PROVIDER_ORDER_ID_MISSING', {
                orderId: order.id,
                paymentProvider: order.paymentProvider,
            });
        }

        await ensureTabbyPaymentClosed(paymentId, tabbySecretKey, order.id);
        return createTabbyRefundForOrder(order, paymentId, tabbySecretKey);
    }

    return queueRefundForOrder(order);
}
enforceServerOnly('refund.service');
