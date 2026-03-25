'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/Toast';
import type { Order } from '@/lib/order/model/order.model';

interface ProceedToShippingButtonProps {
    order: Order;
}

interface MissingWeightProduct {
    productId: string;
    productName: string;
}

export function ProceedToShippingButton({ order }: ProceedToShippingButtonProps) {
    const router = useRouter();
    const { showToast } = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const [showWeightModal, setShowWeightModal] = useState(false);
    const [missingProducts, setMissingProducts] = useState<MissingWeightProduct[]>([]);
    const [weightInputs, setWeightInputs] = useState<Record<string, string>>({});

    // Only show for paid orders that don't have a shipment yet
    if (order.status !== 'paid' || order.shipping?.awb) {
        return null;
    }

    async function callCreateShipment(weightOverrides?: Record<string, number>) {
        setIsLoading(true);
        const url = `/api/admin/orders/${order.id}/shipment`;

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weightOverrides: weightOverrides ?? {} }),
            });

            let body: any = null;
            try { body = await res.json(); } catch { body = null; }

            if (!res.ok) {
                // Missing weights — prompt the admin to enter them
                if (res.status === 400 && body?.code === 'MISSING_PRODUCT_WEIGHTS') {
                    const missingIds: string[] = body?.context?.productIds ?? [];
                    const productList: MissingWeightProduct[] = missingIds.map(pid => ({
                        productId: pid,
                        productName: order.items.find(i => i.productId === pid)?.productName ?? pid,
                    }));
                    setMissingProducts(productList);
                    setWeightInputs(Object.fromEntries(missingIds.map(id => [id, ''])));
                    setShowWeightModal(true);
                    return;
                }

                showToast(
                    body?.message ?? body?.error ?? 'Failed to create shipment',
                    'error',
                    { status: res.status, body, url, method: 'POST' }
                );
                return;
            }

            showToast('Shipment created successfully', 'success', {
                status: res.status, body, url, method: 'POST',
            });
            setShowWeightModal(false);
            router.refresh();
        } catch (error: any) {
            showToast(error?.message ?? 'Failed to create shipment', 'error', {
                body: error instanceof Error ? { stack: error.stack } : { error },
                url,
                method: 'POST',
            });
        } finally {
            setIsLoading(false);
        }
    }

    function handleWeightSubmit() {
        const parsed: Record<string, number> = {};
        for (const [pid, raw] of Object.entries(weightInputs)) {
            const val = parseFloat(raw);
            if (isNaN(val) || val <= 0) {
                showToast(`Please enter a valid weight for ${missingProducts.find(p => p.productId === pid)?.productName ?? pid}`, 'error', {});
                return;
            }
            parsed[pid] = val;
        }
        callCreateShipment(parsed);
    }

    return (
        <>
            <button
                type="button"
                onClick={() => callCreateShipment()}
                disabled={isLoading}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                        </svg>
                        Creating Shipment…
                    </>
                ) : (
                    <>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0l-8 5-8-5m16 0v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4" />
                        </svg>
                        Proceed to Shipping
                    </>
                )}
            </button>

            {/* Weight Override Modal */}
            {showWeightModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] shadow-[var(--shadow-md)] p-6">
                        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-1">
                            Missing Product Weights
                        </h2>
                        <p className="text-sm text-[var(--text-secondary)] mb-5">
                            The following products don't have a weight set. Enter the weight in KG for each before creating the shipment.
                        </p>

                        <div className="space-y-4">
                            {missingProducts.map(p => (
                                <div key={p.productId}>
                                    <label className="block text-sm font-medium text-[var(--text-primary)] mb-1">
                                        {p.productName}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={weightInputs[p.productId] ?? ''}
                                            onChange={e =>
                                                setWeightInputs(prev => ({ ...prev, [p.productId]: e.target.value }))
                                            }
                                            className="w-full rounded-md border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                        />
                                        <span className="text-sm text-[var(--text-muted)] whitespace-nowrap">KG</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => { setShowWeightModal(false); setMissingProducts([]); }}
                                disabled={isLoading}
                                className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] disabled:opacity-60 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleWeightSubmit}
                                disabled={isLoading}
                                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                            >
                                {isLoading ? 'Creating…' : 'Confirm & Ship'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
