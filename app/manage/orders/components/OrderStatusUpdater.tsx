'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import type { OrderStatus } from '@/lib/order/model/order.model';

interface OrderStatusUpdaterProps {
    orderId: string;
    initialStatus: OrderStatus;
}

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'failed', label: 'Failed' },
    { value: 'completed', label: 'Completed' },
];

export function OrderStatusUpdater({ orderId, initialStatus }: OrderStatusUpdaterProps) {
    const [status, setStatus] = useState<OrderStatus>(initialStatus);
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useToast();
    const router = useRouter();

    const handleUpdate = async () => {
        if (status === initialStatus || isSaving) {
            return;
        }

        setIsSaving(true);
        const url = `/api/admin/orders/${orderId}`;

        try {
            const res = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status }),
            });

            let body: any = null;
            try {
                body = await res.json();
            } catch {
                body = null;
            }

            if (!res.ok) {
                const message =
                    body?.message ||
                    body?.error ||
                    'Failed to update order status';
                showToast(message, 'error', {
                    status: res.status,
                    body,
                    url: res.url,
                    method: 'PATCH',
                });
                return;
            }

            setStatus(body.status as OrderStatus);
            router.refresh();

            showToast('Order status updated', 'success', {
                status: res.status,
                body,
                url: res.url,
                method: 'PATCH',
            });
        } catch (error: any) {
            showToast(
                error?.message || 'Failed to update order status',
                'error',
                {
                    body:
                        error instanceof Error
                            ? { stack: error.stack }
                            : { error },
                    url,
                    method: 'PATCH',
                }
            );
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex items-center gap-3">
            <select
                value={status}
                onChange={e => setStatus(e.target.value as OrderStatus)}
                className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
                disabled={isSaving}
            >
                {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            <button
                type="button"
                onClick={handleUpdate}
                disabled={isSaving || status === initialStatus}
                className="inline-flex items-center rounded-md bg-[var(--primary)] px-4 py-1.5 text-sm font-medium text-[var(--primary-foreground)] shadow-sm disabled:opacity-60 disabled:cursor-not-allowed hover:bg-[var(--ring)] transition-colors"
            >
                {isSaving ? 'Updating…' : 'Update status'}
            </button>
        </div>
    );
}
