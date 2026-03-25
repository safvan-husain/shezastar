'use client';

import { useMemo, useState } from 'react';
import { useToast } from '@/components/ui/Toast';

interface OrderShipmentTrackingProps {
    orderId: string;
    awb: string;
    initialStatus?: string;
}

interface ShipmentScan {
    ReceivedBy?: string;
    City: string;
    ScanType: string;
    ScanDescription: string;
    ScanDateTime: string;
    ScanTimeZone?: string;
}

interface TrackingPayload {
    AWB: string;
    Reference?: string;
    isDelivered: boolean;
    Scans?: ShipmentScan[];
}

function parseDate(value: string) {
    const timestamp = new Date(value).getTime();
    return Number.isNaN(timestamp) ? null : timestamp;
}

function formatScanDate(value: string) {
    const timestamp = parseDate(value);
    if (!timestamp) {
        return value || 'Unknown time';
    }
    return new Date(timestamp).toLocaleString();
}

function sortScansByDate(scans: ShipmentScan[]) {
    return [...scans].sort((a, b) => (parseDate(b.ScanDateTime) ?? 0) - (parseDate(a.ScanDateTime) ?? 0));
}

function buildMilestones(payload: TrackingPayload) {
    const scans = payload.Scans ?? [];
    const scanTypes = scans.map((scan) => scan.ScanType.toUpperCase());
    const lowerDescriptions = scans.map((scan) => scan.ScanDescription.toLowerCase());

    const pickedUp = scanTypes.some((type) => ['PU', 'PK', 'PKP', 'HOP'].includes(type))
        || lowerDescriptions.some((detail) => detail.includes('pickup') || detail.includes('picked'));
    const outForDelivery = scanTypes.includes('OD')
        || lowerDescriptions.some((detail) => detail.includes('out for delivery'));
    const delivered = payload.isDelivered
        || scanTypes.includes('DL')
        || lowerDescriptions.some((detail) => detail.includes('deliver'));
    const inTransit = !delivered && scans.length > 0;

    return { pickedUp, inTransit, outForDelivery, delivered };
}

function Milestone({ label, active }: { label: string; active: boolean }) {
    return (
        <div className="flex items-center gap-2">
            <span
                className={`inline-flex h-2.5 w-2.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-gray-300'}`}
                aria-hidden
            />
            <span className={`text-xs ${active ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{label}</span>
        </div>
    );
}

export function OrderShipmentTracking({ orderId, awb, initialStatus }: OrderShipmentTrackingProps) {
    const { showToast } = useToast();
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [tracking, setTracking] = useState<TrackingPayload | null>(null);

    const scans = useMemo(
        () => sortScansByDate(tracking?.Scans ?? []),
        [tracking]
    );
    const milestones = useMemo(
        () => (tracking ? buildMilestones(tracking) : { pickedUp: false, inTransit: false, outForDelivery: false, delivered: false }),
        [tracking]
    );

    async function fetchTracking() {
        const url = `/api/storefront/orders/${orderId}/tracking`;
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
                showToast(body?.message ?? body?.error ?? 'Failed to load shipment tracking', 'error', {
                    status: res.status,
                    body,
                    url: res.url,
                    method: 'GET',
                });
                return;
            }

            setTracking(body as TrackingPayload);
        } catch (error: any) {
            showToast(error?.message ?? 'Failed to load shipment tracking', 'error', {
                body: error instanceof Error ? { stack: error.stack } : { error },
                url,
                method: 'GET',
            });
        } finally {
            setIsLoading(false);
        }
    }

    async function handleToggle() {
        const next = !isExpanded;
        setIsExpanded(next);
        if (next && !tracking && !isLoading) {
            await fetchTracking();
        }
    }

    return (
        <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <p className="text-xs text-gray-500">Shipment AWB</p>
                    <p className="text-sm font-mono font-semibold text-gray-900">{awb}</p>
                </div>
                <div className="flex items-center gap-2">
                    {initialStatus && (
                        <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-700 capitalize">
                            {initialStatus}
                        </span>
                    )}
                    <button
                        type="button"
                        onClick={handleToggle}
                        disabled={isLoading}
                        className="rounded-sm border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-900 hover:bg-gray-100 disabled:opacity-60"
                    >
                        {isExpanded ? 'Hide tracking' : 'Track shipment'}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="mt-3 border-t border-gray-200 pt-3">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-3">
                            <Milestone label="Picked up" active={milestones.pickedUp} />
                            <Milestone label="In transit" active={milestones.inTransit} />
                            <Milestone label="Out for delivery" active={milestones.outForDelivery} />
                            <Milestone label="Delivered" active={milestones.delivered} />
                        </div>
                        <button
                            type="button"
                            onClick={fetchTracking}
                            disabled={isLoading}
                            className="rounded-sm border border-gray-300 bg-white px-2 py-1 text-[11px] font-semibold text-gray-900 hover:bg-gray-100 disabled:opacity-60"
                        >
                            {isLoading ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>

                    {isLoading && !tracking ? (
                        <p className="text-xs text-gray-500">Loading tracking updates...</p>
                    ) : scans.length === 0 ? (
                        <p className="text-xs text-gray-500">
                            No tracking scans yet. The shipment may still be awaiting pickup.
                        </p>
                    ) : (
                        <ol className="space-y-2">
                            {scans.map((scan, index) => (
                                <li key={`${scan.ScanDateTime}-${scan.City}-${scan.ScanType}-${index}`} className="rounded-sm border border-gray-200 bg-white p-2.5">
                                    <p className="text-xs font-semibold text-gray-900">{scan.ScanDescription || 'Status update'}</p>
                                    <p className="mt-0.5 text-xs text-gray-500">
                                        {scan.City || 'Unknown location'} • {formatScanDate(scan.ScanDateTime)}
                                    </p>
                                    {scan.ReceivedBy && (
                                        <p className="mt-0.5 text-[11px] text-gray-500">Received by: {scan.ReceivedBy}</p>
                                    )}
                                </li>
                            ))}
                        </ol>
                    )}
                </div>
            )}
        </div>
    );
}
