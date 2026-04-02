import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorToastHandler, type ToastErrorPayload } from '@/components/ErrorToastHandler';
import type { Order } from '@/lib/order/model/order.model';
import { OrdersStatusFilter } from './components/OrdersStatusFilter';
import { ProceedToShippingButton } from './components/ProceedToShippingButton';

interface OrdersPageProps {
    searchParams: Promise<{ page?: string; status?: string }>;
}

interface OrdersListResponse {
    orders: Order[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

interface PendingActionsResponse {
    pendingShipment: Order[];
    cancellationRequests: Order[];
    returnRequests: Order[];
    total: number;
}

async function getOrders(page?: string, status?: string): Promise<{
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

async function getPendingActions(): Promise<{
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

function formatDate(iso: string) {
    try {
        const date = new Date(iso);
        return date.toLocaleString();
    } catch {
        return iso;
    }
}

function formatStatus(status: Order['status']) {
    if (/^[A-Z]{2,3}$/.test(status)) {
        return status;
    }

    return status
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function getReadableOrderStatus(order: Order) {
    const normalized = formatStatus(order.status);
    if (/^[A-Z]{2,3}$/.test(order.status) && order.shipping?.status) {
        return `${normalized} - ${order.shipping.status}`;
    }

    return normalized;
}

function getCustomerName(order: Order) {
    const firstName = order.billingDetails?.firstName?.trim();
    const lastName = order.billingDetails?.lastName?.trim();
    const parts = [firstName, lastName].filter(Boolean);

    if (parts.length > 0) {
        return parts.join(' ');
    }

    return 'Guest checkout';
}

function getCustomerContact(order: Order) {
    if (order.billingDetails?.email) {
        return order.billingDetails.email;
    }

    if (order.billingDetails?.phone) {
        return order.billingDetails.phone;
    }

    return 'No contact info';
}

function getActionRequestedAt(order: Order, actionType: 'shipment' | 'cancellation' | 'return') {
    if (actionType === 'shipment') {
        return order.createdAt;
    }

    if (actionType === 'cancellation') {
        return order.cancellation?.requestedAt || order.updatedAt;
    }

    return order.returnRequest?.requestedAt || order.updatedAt;
}

function getActionTitle(actionType: 'shipment' | 'cancellation' | 'return') {
    if (actionType === 'shipment') {
        return 'Ready for shipment';
    }

    if (actionType === 'cancellation') {
        return 'Cancellation request';
    }

    return 'Return request';
}

function getActionDescription(actionType: 'shipment' | 'cancellation' | 'return', order: Order) {
    if (actionType === 'shipment') {
        return 'Paid order is waiting to be moved into shipment.';
    }

    if (actionType === 'cancellation') {
        return order.cancellation?.requestReason?.trim() || 'Customer asked to cancel this order.';
    }

    return order.returnRequest?.requestReason?.trim() || 'Customer asked to return this order.';
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
    const { page = '1', status } = await searchParams;
    const [{ orders, pagination, error }, pendingActionsResult] = await Promise.all([
        getOrders(page, status),
        status ? Promise.resolve({ data: null, error: null }) : getPendingActions(),
    ]);

    const pendingActions = pendingActionsResult.data;
    const pendingActionsError = pendingActionsResult.error;
    const shouldShowPendingActions = !status;

    const hasOrders = orders.length > 0;
    const hasPendingActions = Boolean(pendingActions && pendingActions.total > 0);

    const canGoPrev = pagination.page > 1;
    const canGoNext = pagination.totalPages > 0 && pagination.page < pagination.totalPages;

    const buildPageLink = (targetPage: number) => {
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        params.set('page', String(targetPage));
        const query = params.toString();
        return `/manage/orders${query ? `?${query}` : ''}`;
    };

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {error && <ErrorToastHandler error={error} />}
            {pendingActionsError && <ErrorToastHandler error={pendingActionsError} />}
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
                        <div>
                            <h1 className="text-4xl font-bold text-[var(--foreground)] mb-2">
                                Orders
                            </h1>
                            <p className="text-[var(--muted-foreground)] text-lg">
                                Review and manage customer orders
                            </p>
                        </div>
                        <OrdersStatusFilter currentStatus={status} />
                    </div>
                    <div className="h-1 w-24 bg-gradient-to-r from-[var(--primary)] to-[var(--ring)] rounded-full"></div>
                </div>

                {shouldShowPendingActions && (
                    <Card className="mb-8 overflow-hidden">
                        <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-6 py-4">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-[var(--foreground)]">
                                        Pending actions
                                    </h2>
                                    <p className="text-sm text-[var(--muted-foreground)]">
                                        Orders that need an admin decision or shipment action.
                                    </p>
                                </div>
                                <span className="inline-flex w-fit items-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)]">
                                    {pendingActions?.total ?? 0} open
                                </span>
                            </div>
                        </div>

                        {hasPendingActions ? (
                            <div className="divide-y divide-[var(--border-subtle)]">
                                {([
                                    {
                                        key: 'shipment',
                                        label: 'Paid waiting for shipment',
                                        orders: pendingActions?.pendingShipment ?? [],
                                    },
                                    {
                                        key: 'cancellation',
                                        label: 'Cancellation requests',
                                        orders: pendingActions?.cancellationRequests ?? [],
                                    },
                                    {
                                        key: 'return',
                                        label: 'Return requests',
                                        orders: pendingActions?.returnRequests ?? [],
                                    },
                                ] as const).map((group) => (
                                    <section key={group.key} className="px-6 py-5">
                                        <div className="mb-4 flex items-center justify-between gap-3">
                                            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-secondary)]">
                                                {group.label}
                                            </h3>
                                            <span className="text-xs text-[var(--text-muted)]">
                                                {group.orders.length}
                                            </span>
                                        </div>

                                        {group.orders.length > 0 ? (
                                            <div className="space-y-3">
                                                {group.orders.map((order) => {
                                                    const actionType = group.key;
                                                    const customerName = getCustomerName(order);
                                                    const customerContact = getCustomerContact(order);

                                                    return (
                                                        <div
                                                            key={`${actionType}-${order.id}`}
                                                            className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-base)] p-4"
                                                        >
                                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                                <div className="space-y-2">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <p className="text-sm font-semibold text-[var(--text-primary)]">
                                                                            {customerName}
                                                                        </p>
                                                                        <span className="inline-flex items-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
                                                                            {getActionTitle(actionType)}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-sm text-[var(--text-secondary)]">
                                                                        {customerContact}
                                                                    </p>
                                                                    <p className="text-sm text-[var(--text-primary)]">
                                                                        {getActionDescription(actionType, order)}
                                                                    </p>
                                                                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                                                                        <span>Order #{order.id.slice(0, 8)}</span>
                                                                        <span>{order.items.length} items</span>
                                                                        <span>
                                                                            {order.totalAmount.toFixed(2)} {order.currency.toUpperCase()}
                                                                        </span>
                                                                        <span>
                                                                            Requested {formatDate(getActionRequestedAt(order, actionType))}
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                                                                    {actionType === 'shipment' ? (
                                                                        <ProceedToShippingButton order={order} />
                                                                    ) : null}
                                                                    <Link href={`/manage/orders/${order.id}`}>
                                                                        <Button size="sm" variant="ghost">
                                                                            {actionType === 'shipment' ? 'Open order' : 'Review'}
                                                                        </Button>
                                                                    </Link>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-[var(--muted-foreground)]">
                                                No orders in this queue.
                                            </p>
                                        )}
                                    </section>
                                ))}
                            </div>
                        ) : (
                            <div className="px-6 py-8 text-sm text-[var(--muted-foreground)]">
                                No pending actions right now.
                            </div>
                        )}
                    </Card>
                )}

                {/* Content */}
                {error ? (
                    <Card className="text-center py-16">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-[var(--muted)] flex items-center justify-center">
                                <svg
                                    className="w-10 h-10 text-[var(--muted-foreground)]"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M18.364 5.636a9 9 0 11-12.728 0m12.728 0L12 12m0 0L5.636 5.636"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                                    Unable to load orders
                                </h3>
                                <p className="text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
                                    Please try again later. Use the toast details to report the failure if it keeps happening.
                                </p>
                            </div>
                        </div>
                    </Card>
                ) : !hasOrders ? (
                    <Card className="text-center py-16">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-[var(--muted)] flex items-center justify-center">
                                <svg
                                    className="w-10 h-10 text-[var(--muted-foreground)]"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M3 3h18M9 7h6m-9 4h12M6 15h12M9 19h6"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                                    No orders yet
                                </h3>
                                <p className="text-[var(--muted-foreground)] mb-6 max-w-md mx-auto">
                                    Orders placed through the storefront will appear here for review and status updates.
                                </p>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <>
                        <Card className="hidden md:block mb-6 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-[var(--border-subtle)]">
                                    <thead className="bg-[var(--bg-subtle)]">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                                Customer
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                                Created
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                                Items
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                                Gateway
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                                Total
                                            </th>
                                            <th className="px-4 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody className="bg-[var(--bg-base)] divide-y divide-[var(--border-subtle)]">
                                        {orders.map(order => {
                                            const customerName = getCustomerName(order);
                                            const customerContact = getCustomerContact(order);
                                            const itemsCount = order.items.length;
                                            const statusLabel = getReadableOrderStatus(order);

                                            return (
                                                <tr key={order.id} className="hover:bg-[var(--bg-subtle)]">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--text-primary)]">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{customerName}</span>
                                                            <span className="text-[var(--text-muted)] text-xs">
                                                                {customerContact}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                                                        {formatDate(order.createdAt)}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                        <span
                                                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
                                                        >
                                                            {statusLabel}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--text-secondary)]">
                                                        {itemsCount}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                                                        <span className="capitalize">{order.paymentProvider || 'N/A'}</span>
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--text-primary)]">
                                                        {order.totalAmount.toFixed(2)} {order.currency.toUpperCase()}
                                                    </td>
                                                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                                                        <Link href={`/manage/orders/${order.id}`}>
                                                            <Button size="sm" variant="ghost">
                                                                View
                                                            </Button>
                                                        </Link>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </Card>

                        <div className="space-y-4 mb-6 md:hidden">
                            {orders.map(order => {
                                const customerName = getCustomerName(order);
                                const customerContact = getCustomerContact(order);
                                const statusLabel = getReadableOrderStatus(order);
                                const itemsCount = order.items.length;

                                return (
                                    <Card key={order.id} className="p-4">
                                        <div className="flex justify-between items-start gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-[var(--text-primary)]">
                                                    {customerName}
                                                </p>
                                                <p className="text-xs text-[var(--text-secondary)]">
                                                    {customerContact}
                                                </p>
                                            </div>
                                            <span
                                                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
                                            >
                                                {statusLabel}
                                            </span>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-3 text-[var(--text-secondary)] text-xs">
                                            <div>
                                                <p className="uppercase tracking-wide text-[var(--muted-foreground)] text-[10px]">
                                                    Created
                                                </p>
                                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                                    {formatDate(order.createdAt)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="uppercase tracking-wide text-[var(--muted-foreground)] text-[10px]">
                                                    Items
                                                </p>
                                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                                    {itemsCount}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="uppercase tracking-wide text-[var(--muted-foreground)] text-[10px]">
                                                    Gateway
                                                </p>
                                                <p className="text-sm font-semibold text-[var(--text-primary)] capitalize">
                                                    {order.paymentProvider || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between">
                                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                                                {order.totalAmount.toFixed(2)} {order.currency.toUpperCase()}
                                            </p>
                                            <Link href={`/manage/orders/${order.id}`}>
                                                <Button size="sm" variant="ghost">
                                                    View
                                                </Button>
                                            </Link>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4 text-sm text-[var(--text-secondary)]">
                                <div>
                                    Page {pagination.page} of{' '}
                                    {pagination.totalPages}
                                </div>
                                <div className="flex items-center gap-2">
                                    {canGoPrev ? (
                                        <Link href={buildPageLink(pagination.page - 1)}>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                            >
                                                Previous
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            disabled
                                        >
                                            Previous
                                        </Button>
                                    )}
                                    {canGoNext ? (
                                        <Link href={buildPageLink(pagination.page + 1)}>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                            >
                                                Next
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            disabled
                                        >
                                            Next
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
