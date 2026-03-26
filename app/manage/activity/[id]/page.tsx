import Link from 'next/link';

import { Card } from '@/components/ui/Card';
import { ErrorToastHandler, type ToastErrorPayload } from '@/components/ErrorToastHandler';
import { handleGetActivityLog } from '@/lib/activity/activity.controller';
import type { ActivityLog } from '@/lib/activity/model/activity.model';

interface ActivityDetailPageProps {
    params: Promise<{ id: string }>;
}

function formatDateTime(value: string) {
    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function renderValue(value: unknown): string {
    if (value == null) {
        return '—';
    }

    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }

    return JSON.stringify(value, null, 2);
}

function buildEntityHref(entity: ActivityLog['primaryEntity']) {
    if (entity.kind === 'order') {
        return `/manage/orders/${entity.id}`;
    }

    return `/manage/products/${entity.id}/edit`;
}

async function getActivity(id: string): Promise<{
    activity: ActivityLog | null;
    error: ToastErrorPayload | null;
}> {
    const { status, body } = await handleGetActivityLog(id);
    if (status >= 200 && status < 300) {
        return { activity: body as ActivityLog, error: null };
    }

    return {
        activity: null,
        error: {
            message: 'Failed to load activity',
            status,
            body,
            url: `service:admin:activity:${id}`,
            method: 'GET',
        },
    };
}

export default async function ActivityDetailPage({ params }: ActivityDetailPageProps) {
    const { id } = await params;
    const { activity, error } = await getActivity(id);

    if (!activity) {
        return (
            <div className="min-h-screen rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-base)] p-6 text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
                {error && <ErrorToastHandler error={error} />}
                <Card className="rounded-[var(--radius-md)] border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-sm)]">
                    <h1 className="text-2xl font-semibold">Activity not found</h1>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        The requested activity entry could not be loaded.
                    </p>
                </Card>
            </div>
        );
    }

    const detailEntries = Object.entries(activity.details ?? {});
    const bulkProducts = Array.isArray(activity.details?.products) ? activity.details.products : [];

    return (
        <div className="min-h-screen rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-base)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
            {error && <ErrorToastHandler error={error} />}

            <div className="space-y-6 p-5 sm:p-8">
                <nav className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <Link href="/manage" className="transition-colors hover:text-[var(--text-primary)]">
                        Dashboard
                    </Link>
                    <span>/</span>
                    <span className="text-[var(--text-primary)]">Activity Detail</span>
                </nav>

                <Card className="rounded-[var(--radius-md)] border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-sm)]">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                                <span>{activity.actor.displayName || activity.actor.type}</span>
                                <span className="h-1 w-1 rounded-full bg-[var(--text-muted)]" />
                                <span>{activity.actionType}</span>
                            </div>
                            <h1 className="text-3xl font-semibold tracking-[-0.03em]">{activity.summary}</h1>
                            <div className="flex flex-wrap gap-3 text-sm text-[var(--text-secondary)]">
                                <span>{formatDateTime(activity.createdAt)}</span>
                                <span>Primary: {activity.primaryEntity.label}</span>
                            </div>
                        </div>

                        <Link
                            href={buildEntityHref(activity.primaryEntity)}
                            className="inline-flex items-center rounded-[var(--radius-md)] border border-[var(--border-subtle)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--border-strong)]"
                        >
                            Open {activity.primaryEntity.kind}
                        </Link>
                    </div>
                </Card>

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card className="rounded-[var(--radius-md)] border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-sm)]">
                        <h2 className="text-lg font-semibold">Structured Details</h2>
                        {detailEntries.length === 0 ? (
                            <p className="mt-4 text-sm text-[var(--text-secondary)]">No extra details stored for this activity.</p>
                        ) : (
                            <div className="mt-5 space-y-4">
                                {detailEntries
                                    .filter(([key]) => key !== 'products')
                                    .map(([key, value]) => (
                                        <div key={key} className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-base)] p-4">
                                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                                {key}
                                            </p>
                                            <pre className="mt-2 whitespace-pre-wrap break-words text-sm text-[var(--text-primary)]">
                                                {renderValue(value)}
                                            </pre>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </Card>

                    <div className="space-y-6">
                        <Card className="rounded-[var(--radius-md)] border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-sm)]">
                            <h2 className="text-lg font-semibold">Linked Records</h2>
                            <div className="mt-4 space-y-3">
                                <Link
                                    href={buildEntityHref(activity.primaryEntity)}
                                    className="block rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-4 py-3 transition-colors hover:border-[var(--border-strong)]"
                                >
                                    {activity.primaryEntity.label}
                                </Link>
                                {activity.relatedEntities.map((entity) => (
                                    <Link
                                        key={`${entity.kind}-${entity.id}`}
                                        href={buildEntityHref(entity)}
                                        className="block rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-4 py-3 text-sm transition-colors hover:border-[var(--border-strong)]"
                                    >
                                        {entity.label}
                                    </Link>
                                ))}
                            </div>
                        </Card>

                        {bulkProducts.length > 0 && (
                            <Card className="rounded-[var(--radius-md)] border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-sm)]">
                                <h2 className="text-lg font-semibold">Affected Products</h2>
                                <div className="mt-4 space-y-3">
                                    {bulkProducts.map((product) => {
                                        const productRecord = product as Record<string, unknown>;
                                        const productId = typeof productRecord.productId === 'string' ? productRecord.productId : '';
                                        const productName = typeof productRecord.name === 'string' ? productRecord.name : productId;
                                        return (
                                            <Link
                                                key={productId}
                                                href={`/manage/products/${productId}/edit`}
                                                className="block rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-4 py-3 transition-colors hover:border-[var(--border-strong)]"
                                            >
                                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                                    <span className="font-medium text-[var(--text-primary)]">{productName}</span>
                                                    <span className="text-sm text-[var(--text-secondary)]">
                                                        {renderValue(productRecord.basePriceBefore)} → {renderValue(productRecord.basePriceAfter)}
                                                    </span>
                                                </div>
                                                {Array.isArray(productRecord.variantPriceDeltas) && productRecord.variantPriceDeltas.length > 0 && (
                                                    <pre className="mt-2 whitespace-pre-wrap break-words text-xs text-[var(--text-secondary)]">
                                                        {renderValue(productRecord.variantPriceDeltas)}
                                                    </pre>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </Card>
                        )}
                    </div>
                </div>

                <Card className="rounded-[var(--radius-md)] border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-sm)]">
                    <h2 className="text-lg font-semibold">Field Changes</h2>
                    {!activity.diff || activity.diff.length === 0 ? (
                        <p className="mt-4 text-sm text-[var(--text-secondary)]">This activity does not include a field diff.</p>
                    ) : (
                        <div className="mt-5 overflow-x-auto">
                            <table className="min-w-full divide-y divide-[var(--border-subtle)]">
                                <thead>
                                    <tr className="text-left text-xs uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                        <th className="px-3 py-2">Field</th>
                                        <th className="px-3 py-2">Before</th>
                                        <th className="px-3 py-2">After</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-subtle)]">
                                    {activity.diff.map((entry) => (
                                        <tr key={entry.field} className="align-top">
                                            <td className="px-3 py-3 text-sm font-medium text-[var(--text-primary)]">{entry.field}</td>
                                            <td className="px-3 py-3">
                                                <pre className="whitespace-pre-wrap break-words text-xs text-[var(--text-secondary)]">
                                                    {renderValue(entry.before)}
                                                </pre>
                                            </td>
                                            <td className="px-3 py-3">
                                                <pre className="whitespace-pre-wrap break-words text-xs text-[var(--text-primary)]">
                                                    {renderValue(entry.after)}
                                                </pre>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
