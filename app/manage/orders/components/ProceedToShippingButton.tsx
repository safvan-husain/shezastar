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
    currentWeight?: number;
}

interface WeightCheckResponse {
    canProceed: boolean;
    missingProducts: MissingWeightProduct[];
}

export function ProceedToShippingButton({ order }: ProceedToShippingButtonProps) {
    const router = useRouter();
    const { showToast } = useToast();

    const [isLoading, setIsLoading] = useState(false);
    const [showWeightModal, setShowWeightModal] = useState(false);
    const [missingProducts, setMissingProducts] = useState<MissingWeightProduct[]>([]);
    const [weightInputs, setWeightInputs] = useState<Record<string, string>>({});

    if (order.status !== 'paid' || order.shipping?.awb) {
        return null;
    }

    function openWeightModal(products: MissingWeightProduct[]) {
        setMissingProducts(products);
        setWeightInputs(
            Object.fromEntries(
                products.map((product) => [
                    product.productId,
                    typeof product.currentWeight === 'number' && product.currentWeight > 0
                        ? String(product.currentWeight)
                        : '',
                ])
            )
        );
        setShowWeightModal(true);
    }

    function closeWeightModal() {
        setShowWeightModal(false);
        setMissingProducts([]);
        setWeightInputs({});
    }

    async function createShipmentRequest(weightOverrides?: Record<string, number>): Promise<boolean> {
        const url = `/api/admin/orders/${order.id}/shipment`;

        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weightOverrides: weightOverrides ?? {} }),
            });

            let body: any = null;
            try {
                body = await res.json();
            } catch {
                body = null;
            }

            if (!res.ok) {
                if (res.status === 400 && body?.code === 'MISSING_PRODUCT_WEIGHTS') {
                    const missingIds: string[] = body?.details?.productIds ?? body?.context?.productIds ?? [];
                    const productList: MissingWeightProduct[] = missingIds.map((productId) => ({
                        productId,
                        productName:
                            order.items.find((item) => item.productId === productId)?.productName ?? productId,
                    }));
                    openWeightModal(productList);
                    return false;
                }

                showToast(body?.message ?? body?.error ?? 'Failed to create shipment', 'error', {
                    status: res.status,
                    body,
                    url,
                    method: 'POST',
                });
                return false;
            }

            showToast('Shipment created successfully', 'success', {
                status: res.status,
                body,
                url,
                method: 'POST',
            });
            closeWeightModal();
            router.refresh();
            return true;
        } catch (error: any) {
            showToast(error?.message ?? 'Failed to create shipment', 'error', {
                body: error instanceof Error ? { stack: error.stack } : { error },
                url,
                method: 'POST',
            });
            return false;
        }
    }

    async function handleProceedToShipping() {
        const url = `/api/admin/orders/${order.id}/shipment/weight-check`;
        setIsLoading(true);

        try {
            const res = await fetch(url, { method: 'GET' });

            let body: any = null;
            try {
                body = await res.json();
            } catch {
                body = null;
            }

            if (!res.ok) {
                showToast(body?.message ?? body?.error ?? 'Failed to verify product weights', 'error', {
                    status: res.status,
                    body,
                    url,
                    method: 'GET',
                });
                return;
            }

            const data = body as WeightCheckResponse;
            if (data.canProceed) {
                await createShipmentRequest();
                return;
            }

            const products = (data.missingProducts ?? []).map((product) => ({
                productId: product.productId,
                productName:
                    product.productName ||
                    order.items.find((item) => item.productId === product.productId)?.productName ||
                    product.productId,
                currentWeight: product.currentWeight,
            }));
            openWeightModal(products);
        } catch (error: any) {
            showToast(error?.message ?? 'Failed to verify product weights', 'error', {
                body: error instanceof Error ? { stack: error.stack } : { error },
                url,
                method: 'GET',
            });
        } finally {
            setIsLoading(false);
        }
    }

    async function handleWeightSubmit() {
        const parsedWeights: Record<string, number> = {};
        for (const [productId, rawWeight] of Object.entries(weightInputs)) {
            const weight = parseFloat(rawWeight);
            if (Number.isNaN(weight) || weight <= 0) {
                const productName =
                    missingProducts.find((product) => product.productId === productId)?.productName ?? productId;
                showToast(`Please enter a valid weight for ${productName}`, 'error');
                return;
            }
            parsedWeights[productId] = weight;
        }

        const url = `/api/admin/orders/${order.id}/shipment/weights`;
        setIsLoading(true);

        try {
            const res = await fetch(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ weights: parsedWeights }),
            });

            let body: any = null;
            try {
                body = await res.json();
            } catch {
                body = null;
            }

            if (!res.ok) {
                showToast(body?.message ?? body?.error ?? 'Failed to update product weights', 'error', {
                    status: res.status,
                    body,
                    url,
                    method: 'PATCH',
                });
                return;
            }

            showToast('Product weights updated', 'success', {
                status: res.status,
                body,
                url,
                method: 'PATCH',
            });

            await createShipmentRequest();
        } catch (error: any) {
            showToast(error?.message ?? 'Failed to update product weights', 'error', {
                body: error instanceof Error ? { stack: error.stack } : { error },
                url,
                method: 'PATCH',
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <>
            <button
                type="button"
                onClick={handleProceedToShipping}
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
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M20 13V7a2 2 0 00-2-2H6a2 2 0 00-2 2v6m16 0l-8 5-8-5m16 0v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4"
                            />
                        </svg>
                        Proceed to Shipping
                    </>
                )}
            </button>

            {showWeightModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-md flex-col rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-6 text-left shadow-[var(--shadow-md)]">
                        <h2 className="mb-1 whitespace-normal break-words text-left [overflow-wrap:anywhere] text-lg font-semibold text-[var(--text-primary)]">
                            Missing Product Weights
                        </h2>
                        <p className="mb-5 whitespace-normal break-words text-left [overflow-wrap:anywhere] text-sm text-[var(--text-secondary)]">
                            The following products don&apos;t have a weight set. Enter the weight in KG for each before creating the shipment.
                        </p>

                        <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
                            {missingProducts.map((product) => (
                                <div key={product.productId}>
                                    <label className="mb-1 block whitespace-normal break-words text-left [overflow-wrap:anywhere] text-sm font-medium text-[var(--text-primary)]">
                                        {product.productName}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={weightInputs[product.productId] ?? ''}
                                            onChange={(event) =>
                                                setWeightInputs((prev) => ({
                                                    ...prev,
                                                    [product.productId]: event.target.value,
                                                }))
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
                                onClick={closeWeightModal}
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
                                {isLoading ? 'Creating…' : 'Save & Ship'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
