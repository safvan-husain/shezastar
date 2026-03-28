import { AppError } from '@/lib/errors/app-error';
import type { Order } from '@/lib/order/model/order.model';
import { enforceServerOnly } from '@/lib/utils/server-only';

type EmailRecipient = {
    email: string;
    name?: string;
};

type OrderNotificationKind =
    | 'order_paid'
    | 'shipment_approved'
    | 'cancellation_approved'
    | 'return_approved'
    | 'refunded'
    | 'order_cancelled'
    | 'admin_new_order'
    | 'admin_cancellation_requested'
    | 'admin_return_requested';

const DEFAULT_SENDER_NAME = 'Sheza Star';
const DEFAULT_SENDER_EMAIL = 'info@shezastar.com';
const DEFAULT_ADMIN_NAME = 'Sheza Star Admin';
const DEFAULT_ADMIN_EMAIL = 'info@shezastar.com';

function getBrevoApiKey(): string | undefined {
    return process.env.BRAVO_API_KEY || process.env.BREVO_API_KEY;
}

function getSender(): EmailRecipient {
    return {
        name: process.env.BRAVO_SENDER_NAME || process.env.BREVO_SENDER_NAME || DEFAULT_SENDER_NAME,
        email: process.env.BRAVO_SENDER_EMAIL || process.env.BREVO_SENDER_EMAIL || DEFAULT_SENDER_EMAIL,
    };
}

function getAdminRecipient(): EmailRecipient {
    return {
        name: process.env.BRAVO_ADMIN_NAME || process.env.BREVO_ADMIN_NAME || DEFAULT_ADMIN_NAME,
        email: process.env.BRAVO_ADMIN_EMAIL
            || process.env.BREVO_ADMIN_EMAIL
            || process.env.ORDER_NOTIFICATION_ADMIN_EMAIL
            || DEFAULT_ADMIN_EMAIL,
    };
}

function formatOrderAmount(totalAmount: number, currency: string): string {
    const normalizedCurrency = currency.toUpperCase();

    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: normalizedCurrency,
        }).format(totalAmount);
    } catch {
        return `${totalAmount.toFixed(2)} ${normalizedCurrency}`;
    }
}

function getOrderLabel(order: Order): string {
    return `#${order.id.slice(-8).toUpperCase()}`;
}

function buildCustomerRecipient(order: Order): EmailRecipient {
    const email = order.billingDetails?.email?.trim();
    if (!email) {
        throw new AppError(400, 'ORDER_EMAIL_RECIPIENT_MISSING', {
            orderId: order.id,
            message: 'Order billing email is required to send order notification email',
        });
    }

    const firstName = order.billingDetails?.firstName?.trim();
    const lastName = order.billingDetails?.lastName?.trim();
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();

    return {
        email,
        ...(fullName ? { name: fullName } : {}),
    };
}

function escapeHtml(value: string): string {
    return value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

function buildOrderLines(order: Order): string[] {
    return order.items.map((item) => {
        const variant = item.variantName?.trim() ? ` (${item.variantName.trim()})` : '';
        return `${item.quantity} x ${item.productName}${variant}`;
    });
}

function buildCustomerEmailContent(kind: Extract<OrderNotificationKind, 'order_paid' | 'shipment_approved' | 'cancellation_approved' | 'return_approved' | 'refunded' | 'order_cancelled'>, order: Order) {
    const orderLabel = getOrderLabel(order);
    const amount = formatOrderAmount(order.totalAmount, order.currency);
    const awb = order.shipping?.awb?.trim();

    if (kind === 'order_paid') {
        return {
            subject: `Order received: ${orderLabel}`,
            textContent: `Thank you for your order. Your order ${orderLabel} has been paid successfully. Total: ${amount}.`,
            htmlContent: `<p>Thank you for your order.</p><p>Your order <strong>${escapeHtml(orderLabel)}</strong> has been paid successfully.</p><p>Total: <strong>${escapeHtml(amount)}</strong></p>`,
        };
    }

    if (kind === 'shipment_approved') {
        const trackingText = awb ? ` Tracking number: ${awb}.` : '';
        const trackingHtml = awb ? `<p>Tracking number: <strong>${escapeHtml(awb)}</strong></p>` : '';

        return {
            subject: `Shipment approved: ${orderLabel}`,
            textContent: `Your order ${orderLabel} has been approved for shipment.${trackingText} Total: ${amount}.`,
            htmlContent: `<p>Your order <strong>${escapeHtml(orderLabel)}</strong> has been approved for shipment.</p>${trackingHtml}<p>Total: <strong>${escapeHtml(amount)}</strong></p>`,
        };
    }

    if (kind === 'cancellation_approved') {
        return {
            subject: `Cancellation approved: ${orderLabel}`,
            textContent: `Your cancellation request for order ${orderLabel} has been approved. Refund processing has started. Total: ${amount}.`,
            htmlContent: `<p>Your cancellation request for order <strong>${escapeHtml(orderLabel)}</strong> has been approved.</p><p>Refund processing has started.</p><p>Total: <strong>${escapeHtml(amount)}</strong></p>`,
        };
    }

    if (kind === 'return_approved') {
        return {
            subject: `Return approved: ${orderLabel}`,
            textContent: `Your return request for order ${orderLabel} has been approved. Return shipment processing has started. Total: ${amount}.`,
            htmlContent: `<p>Your return request for order <strong>${escapeHtml(orderLabel)}</strong> has been approved.</p><p>Return shipment processing has started.</p><p>Total: <strong>${escapeHtml(amount)}</strong></p>`,
        };
    }

    if (kind === 'refunded') {
        return {
            subject: `Refund completed: ${orderLabel}`,
            textContent: `Your refund for order ${orderLabel} has been completed. Total refunded: ${amount}.`,
            htmlContent: `<p>Your refund for order <strong>${escapeHtml(orderLabel)}</strong> has been completed.</p><p>Total refunded: <strong>${escapeHtml(amount)}</strong></p>`,
        };
    }

    return {
        subject: `Order cancelled: ${orderLabel}`,
        textContent: `Your order ${orderLabel} has been cancelled. Total: ${amount}.`,
        htmlContent: `<p>Your order <strong>${escapeHtml(orderLabel)}</strong> has been cancelled.</p><p>Total: <strong>${escapeHtml(amount)}</strong></p>`,
    };
}

function buildAdminEmailContent(kind: Extract<OrderNotificationKind, 'admin_new_order' | 'admin_cancellation_requested' | 'admin_return_requested'>, order: Order) {
    const orderLabel = getOrderLabel(order);
    const amount = formatOrderAmount(order.totalAmount, order.currency);
    const customer = buildCustomerRecipient(order);
    const customerLine = customer.name ? `${customer.name} <${customer.email}>` : customer.email;
    const orderLines = buildOrderLines(order);
    const itemsText = orderLines.length > 0 ? `Items: ${orderLines.join(', ')}.` : '';
    const itemsHtml = orderLines.length > 0
        ? `<p>Items:</p><ul>${orderLines.map((line) => `<li>${escapeHtml(line)}</li>`).join('')}</ul>`
        : '';

    if (kind === 'admin_new_order') {
        return {
            subject: `New order received: ${orderLabel}`,
            textContent: `A new paid order has arrived. Order: ${orderLabel}. Customer: ${customerLine}. Total: ${amount}. ${itemsText}`.trim(),
            htmlContent: `<h2>New Order</h2><p>Order <strong>${escapeHtml(orderLabel)}</strong> has been paid.</p><p>Customer: ${escapeHtml(customerLine)}</p><p>Total: <strong>${escapeHtml(amount)}</strong></p>${itemsHtml}`,
        };
    }

    const reason = kind === 'admin_return_requested'
        ? order.returnRequest?.requestReason?.trim()
        : order.cancellation?.requestReason?.trim();
    const reasonText = reason ? ` Reason: ${reason}.` : '';
    const reasonHtml = reason ? `<p>Reason: ${escapeHtml(reason)}</p>` : '';

    if (kind === 'admin_return_requested') {
        return {
            subject: `Return requested: ${orderLabel}`,
            textContent: `A return request was submitted. Order: ${orderLabel}. Customer: ${customerLine}. Total: ${amount}.${reasonText} ${itemsText}`.trim(),
            htmlContent: `<h2>Return Requested</h2><p>Order <strong>${escapeHtml(orderLabel)}</strong> now has a return request.</p><p>Customer: ${escapeHtml(customerLine)}</p><p>Total: <strong>${escapeHtml(amount)}</strong></p>${reasonHtml}${itemsHtml}`,
        };
    }

    return {
        subject: `Cancellation requested: ${orderLabel}`,
        textContent: `A cancellation or return request was submitted. Order: ${orderLabel}. Customer: ${customerLine}. Total: ${amount}.${reasonText} ${itemsText}`.trim(),
        htmlContent: `<h2>Cancellation Requested</h2><p>Order <strong>${escapeHtml(orderLabel)}</strong> now has a cancellation or return request.</p><p>Customer: ${escapeHtml(customerLine)}</p><p>Total: <strong>${escapeHtml(amount)}</strong></p>${reasonHtml}${itemsHtml}`,
    };
}

async function sendEmail(to: EmailRecipient[], payload: { subject: string; textContent: string; htmlContent: string }): Promise<void> {
    const apiKey = getBrevoApiKey();
    if (!apiKey) {
        return;
    }

    const { BrevoClient } = await import('@getbrevo/brevo');
    const brevo = new BrevoClient({ apiKey });

    await brevo.transactionalEmails.sendTransacEmail({
        sender: getSender(),
        to,
        subject: payload.subject,
        textContent: payload.textContent,
        htmlContent: payload.htmlContent,
    });
}

export async function sendCustomerOrderEmail(
    kind: Extract<OrderNotificationKind, 'order_paid' | 'shipment_approved' | 'cancellation_approved' | 'return_approved' | 'refunded' | 'order_cancelled'>,
    order: Order,
): Promise<void> {
    try {
        const recipient = buildCustomerRecipient(order);
        const payload = buildCustomerEmailContent(kind, order);
        await sendEmail([recipient], payload);
    } catch (error) {
        console.error('Failed to send customer order email', {
            kind,
            orderId: order.id,
            error,
        });
    }
}

export async function sendAdminOrderEmail(
    kind: Extract<OrderNotificationKind, 'admin_new_order' | 'admin_cancellation_requested' | 'admin_return_requested'>,
    order: Order,
): Promise<void> {
    try {
        const payload = buildAdminEmailContent(kind, order);
        await sendEmail([getAdminRecipient()], payload);
    } catch (error) {
        console.error('Failed to send admin order email', {
            kind,
            orderId: order.id,
            error,
        });
    }
}

enforceServerOnly('email.service');
