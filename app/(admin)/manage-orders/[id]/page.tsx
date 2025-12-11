import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { ErrorToastHandler, type ToastErrorPayload } from '@/components/ErrorToastHandler';
import type { Order } from '@/lib/order/model/order.model';
import { OrderStatusUpdater } from '../components/OrderStatusUpdater';

interface OrderDetailPageProps {
    params: Promise<{ id: string }>;
}

async function getOrder(id: string): Promise<{ order: Order | null; error: ToastErrorPayload | null }> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const url = `${baseUrl}/api/admin/orders/${id}`;

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
                order: null,
                error: {
                    message: body.message || body.error || 'Failed to load order',
                    status: res.status,
                    body,
                    url: res.url,
                    method: 'GET',
                },
            };
        }

        return {
            order: (await res.json()) as Order,
            error: null,
        };
    } catch (error) {
        return {
            order: null,
            error: {
                message: error instanceof Error ? error.message : 'Failed to load order',
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

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
    const { id } = await params;
    const { order, error } = await getOrder(id);

    if (!order && !error) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <h1 className="text-2xl font-bold text-[var(--foreground)] mb-2">
                    Order not found
                </h1>
                <p className="text-[var(--muted-foreground)]">
                    We could not find this order. It may have been removed or the link is incorrect.
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)]">
            {error && <ErrorToastHandler error={error} />}
            <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
                {/* Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
                    <Link href="/manage-orders" className="hover:text-[var(--foreground)] transition-colors">
                        Orders
                    </Link>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-[var(--foreground)] font-medium">
                        {order ? `#${order.id.slice(0, 8)}` : 'Order'}
                    </span>
                </nav>

                {order && (
                    <>
                        {/* Header */}
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-[var(--foreground)] mb-1">
                                    Order #{order.id.slice(0, 8)}
                                </h1>
                                <p className="text-[var(--muted-foreground)]">
                                    Created {formatDate(order.createdAt)}
                                </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)]">
                                    {formatStatus(order.status)}
                                </span>
                                <OrderStatusUpdater orderId={order.id} initialStatus={order.status} />
                            </div>
                        </div>

                        {/* Summary */}
                        <Card>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">
                                        Payment
                                    </h2>
                                    <p className="text-[var(--text-primary)]">
                                        Total:{' '}
                                        <span className="font-semibold">
                                            {order.totalAmount.toFixed(2)}{' '}
                                            {order.currency.toUpperCase()}
                                        </span>
                                    </p>
                                    <p className="text-[var(--text-secondary)] mt-1">
                                        Stripe session:{' '}
                                        {order.stripeSessionId ?? 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">
                                        Metadata
                                    </h2>
                                    <p className="text-[var(--text-secondary)]">
                                        Session ID: <span className="font-mono">{order.sessionId}</span>
                                    </p>
                                    <p className="text-[var(--text-secondary)] mt-1">
                                        Updated:{' '}
                                        {formatDate(order.updatedAt)}
                                    </p>
                                </div>
                            </div>
                        </Card>

                        {/* Items */}
                        <Card>
                            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">
                                Items
                            </h2>
                            {order.items.length === 0 ? (
                                <p className="text-sm text-[var(--muted-foreground)]">
                                    This order has no items.
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {order.items.map((item, index) => (
                                        <div
                                            key={`${item.productId}-${index}`}
                                            className="flex items-start gap-4 border-b border-[var(--border-subtle)] pb-4 last:border-b-0 last:pb-0"
                                        >
                                            <div className="w-16 h-16 rounded-md bg-[var(--bg-subtle)] flex items-center justify-center overflow-hidden flex-shrink-0">
                                                {item.productImage ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img
                                                        src={item.productImage}
                                                        alt={item.productName}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="text-xs text-[var(--muted-foreground)] text-center px-2">
                                                        No image
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div>
                                                        <p className="text-sm font-medium text-[var(--text-primary)]">
                                                            {item.productName}
                                                        </p>
                                                        {item.variantName && (
                                                            <p className="text-xs text-[var(--text-secondary)]">
                                                                {item.variantName}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="text-right text-sm text-[var(--text-secondary)]">
                                                        <p>
                                                            Qty:{' '}
                                                            <span className="font-semibold">
                                                                {item.quantity}
                                                            </span>
                                                        </p>
                                                        <p>
                                                            Unit:{' '}
                                                            {item.unitPrice.toFixed(2)}{' '}
                                                            {order.currency.toUpperCase()}
                                                        </p>
                                                        <p className="font-semibold text-[var(--text-primary)] mt-1">
                                                            {(item.unitPrice * item.quantity).toFixed(2)}{' '}
                                                            {order.currency.toUpperCase()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </Card>
                    </>
                )}
            </div>
        </div>
    );
}
