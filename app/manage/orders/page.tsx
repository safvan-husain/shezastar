import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorToastHandler } from '@/components/ErrorToastHandler';
import { OrdersStatusFilter } from './components/OrdersStatusFilter';
import {
    formatDate,
    getCustomerContact,
    getCustomerName,
    getOrders,
    getReadableOrderStatus,
} from './order-page-data';

interface OrdersPageProps {
    searchParams: Promise<{ page?: string; status?: string }>;
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
            <div className="container mx-auto max-w-7xl px-4 py-8">
                <div className="mb-10">
                    <div className="mb-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h1 className="mb-2 text-4xl font-bold text-[var(--foreground)]">
                                Orders
                            </h1>
                            <p className="text-lg text-[var(--muted-foreground)]">
                                Review and manage customer orders
                            </p>
                        </div>
                        <div className="flex flex-col gap-3 sm:items-end">
                            <Link href="/manage/orders/pending-actions">
                                <Button variant="ghost">View pending actions</Button>
                            </Link>
                            <OrdersStatusFilter currentStatus={status} />
                        </div>
                    </div>
                    <div className="h-1 w-24 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--ring)]" />
                </div>

                {error ? (
                    <Card className="py-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--muted)]">
                                <svg
                                    className="h-10 w-10 text-[var(--muted-foreground)]"
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
                                <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
                                    Unable to load orders
                                </h3>
                                <p className="mx-auto mb-6 max-w-md text-[var(--muted-foreground)]">
                                    Please try again later. Use the toast details to report the failure if it keeps happening.
                                </p>
                            </div>
                        </div>
                    </Card>
                ) : !hasOrders ? (
                    <Card className="py-16 text-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--muted)]">
                                <svg
                                    className="h-10 w-10 text-[var(--muted-foreground)]"
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
                                <h3 className="mb-2 text-xl font-semibold text-[var(--foreground)]">
                                    No orders yet
                                </h3>
                                <p className="mx-auto mb-6 max-w-md text-[var(--muted-foreground)]">
                                    Orders placed through the storefront will appear here for review and status updates.
                                </p>
                            </div>
                        </div>
                    </Card>
                ) : (
                    <>
                        <Card className="mb-6 hidden overflow-hidden md:block">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-[var(--border-subtle)]">
                                    <thead className="bg-[var(--bg-subtle)]">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                                                Customer
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                                                Created
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                                                Status
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                                                Items
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                                                Gateway
                                            </th>
                                            <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-[var(--text-secondary)]">
                                                Total
                                            </th>
                                            <th className="px-4 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border-subtle)] bg-[var(--bg-base)]">
                                        {orders.map((order) => {
                                            const customerName = getCustomerName(order);
                                            const customerContact = getCustomerContact(order);
                                            const itemsCount = order.items.length;
                                            const statusLabel = getReadableOrderStatus(order);

                                            return (
                                                <tr key={order.id} className="hover:bg-[var(--bg-subtle)]">
                                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[var(--text-primary)]">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{customerName}</span>
                                                            <span className="text-xs text-[var(--text-muted)]">
                                                                {customerContact}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[var(--text-secondary)]">
                                                        {formatDate(order.createdAt)}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                                                        <span className="inline-flex items-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
                                                            {statusLabel}
                                                        </span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-[var(--text-secondary)]">
                                                        {itemsCount}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[var(--text-secondary)]">
                                                        <span className="capitalize">{order.paymentProvider || 'N/A'}</span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm text-[var(--text-primary)]">
                                                        {order.totalAmount.toFixed(2)} {order.currency.toUpperCase()}
                                                    </td>
                                                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
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

                        <div className="mb-6 space-y-4 md:hidden">
                            {orders.map((order) => {
                                const customerName = getCustomerName(order);
                                const customerContact = getCustomerContact(order);
                                const statusLabel = getReadableOrderStatus(order);
                                const itemsCount = order.items.length;

                                return (
                                    <Card key={order.id} className="p-4">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-[var(--text-primary)]">
                                                    {customerName}
                                                </p>
                                                <p className="text-xs text-[var(--text-secondary)]">
                                                    {customerContact}
                                                </p>
                                            </div>
                                            <span className="inline-flex items-center rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
                                                {statusLabel}
                                            </span>
                                        </div>
                                        <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-[var(--text-secondary)]">
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                                                    Created
                                                </p>
                                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                                    {formatDate(order.createdAt)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                                                    Items
                                                </p>
                                                <p className="text-sm font-semibold text-[var(--text-primary)]">
                                                    {itemsCount}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
                                                    Gateway
                                                </p>
                                                <p className="text-sm font-semibold capitalize text-[var(--text-primary)]">
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

                        {pagination.totalPages > 1 && (
                            <div className="mt-4 flex items-center justify-between text-sm text-[var(--text-secondary)]">
                                <div>
                                    Page {pagination.page} of {pagination.totalPages}
                                </div>
                                <div className="flex items-center gap-2">
                                    {canGoPrev ? (
                                        <Link href={buildPageLink(pagination.page - 1)}>
                                            <Button size="sm" variant="ghost">
                                                Previous
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Button size="sm" variant="ghost" disabled>
                                            Previous
                                        </Button>
                                    )}
                                    {canGoNext ? (
                                        <Link href={buildPageLink(pagination.page + 1)}>
                                            <Button size="sm" variant="ghost">
                                                Next
                                            </Button>
                                        </Link>
                                    ) : (
                                        <Button size="sm" variant="ghost" disabled>
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
