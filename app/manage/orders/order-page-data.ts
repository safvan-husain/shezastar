import type { ToastErrorPayload } from '@/components/ErrorToastHandler';
import type { Order } from '@/lib/order/model/order.model';

export interface OrdersListResponse {
    orders: Order[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

export interface PendingActionsResponse {
    pendingShipment: Order[];
    cancellationRequests: Order[];
    returnRequests: Order[];
    total: number;
}

export async function getOrders(page?: string, status?: string): Promise<{
    orders: Order[];
    pagination: OrdersListResponse['pagination'];
    error: ToastErrorPayload | null;
}> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const params = new URLSearchParams();

    if (page) params.set('page', page);
    if (status) params.set('status', status);

    const url = `${baseUrl}/api/admin/orders${params.toString() ? `?${params.toString()}` : ''}`;

    try {
        const res = await fetch(url, { cache: 'no-store' });

        if (!res.ok) {
            let body: any = {};
            try {
                body = await res.json();
            } catch {
                body = { error: 'Failed to parse response body' };
            }

            return {
                orders: [],
                pagination: {
                    page: 1,
                    limit: 20,
                    total: 0,
                    totalPages: 0,
                },
                error: {
                    message: body.message || body.error || 'Failed to load orders',
                    status: res.status,
                    body,
                    url: res.url,
                    method: 'GET',
                },
            };
        }

        const data = (await res.json()) as OrdersListResponse;
        return {
            orders: data.orders ?? [],
            pagination: data.pagination ?? {
                page: 1,
                limit: 20,
                total: 0,
                totalPages: 0,
            },
            error: null,
        };
    } catch (error) {
        return {
            orders: [],
            pagination: {
                page: 1,
                limit: 20,
                total: 0,
                totalPages: 0,
            },
            error: {
                message: error instanceof Error ? error.message : 'Failed to load orders',
                body: error instanceof Error ? { stack: error.stack } : { error },
                url,
                method: 'GET',
            },
        };
    }
}

export async function getPendingActions(): Promise<{
    data: PendingActionsResponse | null;
    error: ToastErrorPayload | null;
}> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/admin/orders/pending-actions`;

    try {
        const res = await fetch(url, { cache: 'no-store' });

        if (!res.ok) {
            let body: any = {};
            try {
                body = await res.json();
            } catch {
                body = { error: 'Failed to parse response body' };
            }

            return {
                data: null,
                error: {
                    message: body.message || body.error || 'Failed to load pending actions',
                    status: res.status,
                    body,
                    url: res.url,
                    method: 'GET',
                },
            };
        }

        return {
            data: (await res.json()) as PendingActionsResponse,
            error: null,
        };
    } catch (error) {
        return {
            data: null,
            error: {
                message: error instanceof Error ? error.message : 'Failed to load pending actions',
                body: error instanceof Error ? { stack: error.stack } : { error },
                url,
                method: 'GET',
            },
        };
    }
}

export function formatDate(iso: string) {
    try {
        const date = new Date(iso);
        return date.toLocaleString();
    } catch {
        return iso;
    }
}

export function formatStatus(status: Order['status']) {
    if (/^[A-Z]{2,3}$/.test(status)) {
        return status;
    }

    return status
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

export function getReadableOrderStatus(order: Order) {
    const normalized = formatStatus(order.status);
    if (/^[A-Z]{2,3}$/.test(order.status) && order.shipping?.status) {
        return `${normalized} - ${order.shipping.status}`;
    }

    return normalized;
}

export function getCustomerName(order: Order) {
    const firstName = order.billingDetails?.firstName?.trim();
    const lastName = order.billingDetails?.lastName?.trim();
    const parts = [firstName, lastName].filter(Boolean);

    if (parts.length > 0) {
        return parts.join(' ');
    }

    return 'Guest checkout';
}

export function getCustomerContact(order: Order) {
    if (order.billingDetails?.email) {
        return order.billingDetails.email;
    }

    if (order.billingDetails?.phone) {
        return order.billingDetails.phone;
    }

    return 'No contact info';
}

export function getActionRequestedAt(order: Order, actionType: 'shipment' | 'cancellation' | 'return') {
    if (actionType === 'shipment') {
        return order.createdAt;
    }

    if (actionType === 'cancellation') {
        return order.cancellation?.requestedAt || order.updatedAt;
    }

    return order.returnRequest?.requestedAt || order.updatedAt;
}

export function getActionTitle(actionType: 'shipment' | 'cancellation' | 'return') {
    if (actionType === 'shipment') {
        return 'Ready for shipment';
    }

    if (actionType === 'cancellation') {
        return 'Cancellation request';
    }

    return 'Return request';
}

export function getActionDescription(actionType: 'shipment' | 'cancellation' | 'return', order: Order) {
    if (actionType === 'shipment') {
        return 'Paid order is waiting to be moved into shipment.';
    }

    if (actionType === 'cancellation') {
        return order.cancellation?.requestReason?.trim() || 'Customer asked to cancel this order.';
    }

    return order.returnRequest?.requestReason?.trim() || 'Customer asked to return this order.';
}
