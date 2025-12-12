import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorToastHandler, type ToastErrorPayload } from '@/components/ErrorToastHandler';
import type { Order } from '@/lib/order/model/order.model';
import { OrdersStatusFilter } from './components/OrdersStatusFilter';

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

function formatDate(iso: string) {
    try {
        const date = new Date(iso);
        return date.toLocaleString();
    } catch {
        return iso;
    }
}

function formatStatus(status: Order['status']) {
    return status.charAt(0).toUpperCase() + status.slice(1);
}

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
    const { page = '1', status } = await searchParams;
    const { orders, pagination, error } = await getOrders(page, status);

    const hasOrders = orders.length > 0;

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
                        <Card className="mb-6 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-[var(--border-subtle)]">
                                    <thead className="bg-[var(--bg-subtle)]">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                                Order
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
                                            <th className="px-4 py-3 text-right text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">
                                                Total
                                            </th>
                                            <th className="px-4 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody className="bg-[var(--bg-base)] divide-y divide-[var(--border-subtle)]">
                                        {orders.map(order => {
                                            const itemsCount = order.items.length;
                                            const idShort = order.id.slice(0, 8);
                                            const statusLabel = formatStatus(order.status);

                                            return (
                                                <tr key={order.id} className="hover:bg-[var(--bg-subtle)]">
                                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--text-primary)]">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">#{idShort}</span>
                                                            <span className="text-[var(--text-muted)] text-xs">
                                                                Session: {order.sessionId}
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
