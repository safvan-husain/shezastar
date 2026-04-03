import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import type { PendingActionsResponse } from '../order-page-data';
import {
    formatDate,
    getActionDescription,
    getActionRequestedAt,
    getActionTitle,
    getCustomerContact,
    getCustomerName,
} from '../order-page-data';
import { ProceedToShippingButton } from './ProceedToShippingButton';

interface PendingActionsContentProps {
    pendingActions: PendingActionsResponse | null;
}

export function PendingActionsContent({ pendingActions }: PendingActionsContentProps) {
    const hasPendingActions = Boolean(pendingActions && pendingActions.total > 0);

    return (
        <Card className="overflow-hidden">
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
    );
}
