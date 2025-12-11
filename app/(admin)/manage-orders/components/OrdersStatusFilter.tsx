'use client';

import { useRouter, useSearchParams } from 'next/navigation';

const STATUS_OPTIONS = [
    { value: '', label: 'All statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'cancelled', label: 'Cancelled' },
    { value: 'failed', label: 'Failed' },
    { value: 'completed', label: 'Completed' },
];

interface OrdersStatusFilterProps {
    currentStatus?: string;
}

export function OrdersStatusFilter({ currentStatus }: OrdersStatusFilterProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const nextStatus = event.target.value;
        const params = new URLSearchParams(searchParams.toString());

        if (nextStatus) {
            params.set('status', nextStatus);
        } else {
            params.delete('status');
        }

        // Reset page when changing filter
        params.delete('page');

        const query = params.toString();
        router.push(`/manage-orders${query ? `?${query}` : ''}`);
    };

    return (
        <div className="inline-flex items-center gap-2">
            <span className="text-sm text-[var(--text-secondary)]">Status</span>
            <select
                value={currentStatus ?? ''}
                onChange={handleChange}
                className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent"
            >
                {STATUS_OPTIONS.map(option => (
                    <option key={option.value || 'all'} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
