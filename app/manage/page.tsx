import Link from 'next/link';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorToastHandler, type ToastErrorPayload } from '@/components/ErrorToastHandler';
import { handleGetDashboardAnalytics } from '@/lib/activity/activity.controller';
import type {
    ActivityActionType,
    ActivityEntityKind,
    DashboardAnalytics,
} from '@/lib/activity/model/activity.model';

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'AED',
        maximumFractionDigits: 0,
    }).format(amount);
}

function formatDateLabel(date: string) {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
    }).format(new Date(`${date}T00:00:00.000Z`));
}

function formatStatus(status: string) {
    if (/^[A-Z]{2,3}$/.test(status)) {
        return status;
    }

    return status
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function getStatusColor(status: string) {
    const normalized = status.toLowerCase();
    const colorMap: Record<string, string> = {
        pending: '#d97706',
        paid: '#0f766e',
        requested_shipment: '#2563eb',
        shipped: '#2563eb',
        af: '#4f46e5',
        od: '#7c3aed',
        dl: '#16a34a',
        cancellation_requested: '#ea580c',
        cancellation_approved: '#dc2626',
        cancelled: '#b91c1c',
        refund_failed: '#be185d',
        failed: '#6b7280',
    };

    return colorMap[normalized] || '#525252';
}

type ActivityTone = 'emerald' | 'blue' | 'amber' | 'red' | 'violet' | 'slate';

function getActivityTone(actionType: ActivityActionType): ActivityTone {
    switch (actionType) {
        case 'product.created':
        case 'order.created':
        case 'order.shipment_created':
            return 'emerald';
        case 'product.updated':
        case 'product.bulk_price_updated':
        case 'order.status_updated':
            return 'blue';
        case 'order.return_requested':
        case 'order.refund_initiated':
            return 'amber';
        case 'product.deleted':
        case 'order.cancellation_reviewed':
        case 'order.return_reviewed':
            return 'red';
        default:
            return 'violet';
    }
}

function getActivityToneClasses(tone: ActivityTone) {
    const map: Record<ActivityTone, string> = {
        emerald: 'border-[var(--activity-emerald-border)] bg-[var(--activity-emerald-bg)] text-[var(--activity-emerald-text)]',
        blue: 'border-[var(--activity-blue-border)] bg-[var(--activity-blue-bg)] text-[var(--activity-blue-text)]',
        amber: 'border-[var(--activity-amber-border)] bg-[var(--activity-amber-bg)] text-[var(--activity-amber-text)]',
        red: 'border-[var(--activity-red-border)] bg-[var(--activity-red-bg)] text-[var(--activity-red-text)]',
        violet: 'border-[var(--activity-violet-border)] bg-[var(--activity-violet-bg)] text-[var(--activity-violet-text)]',
        slate: 'border-[var(--activity-slate-border)] bg-[var(--activity-slate-bg)] text-[var(--activity-slate-text)]',
    };

    return map[tone];
}

function formatActionLabel(actionType: ActivityActionType) {
    const [domain, action] = actionType.split('.');
    const normalizedAction = action
        .split('_')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

    return `${domain.charAt(0).toUpperCase() + domain.slice(1)} ${normalizedAction}`;
}

function formatActorLabel(displayName: string | undefined, actorType: string) {
    return displayName || actorType.charAt(0).toUpperCase() + actorType.slice(1);
}

function ActivityIcon({
    actionType,
    entityKind,
    className = 'h-5 w-5',
}: {
    actionType: ActivityActionType;
    entityKind: ActivityEntityKind;
    className?: string;
}) {
    const commonProps = {
        className,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.8,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
        'aria-hidden': true,
    };

    if (actionType.includes('shipment')) {
        return (
            <svg {...commonProps}>
                <path d="M3 7.5h11v8H3z" />
                <path d="M14 10.5h3.5l2.5 2.5v2.5H14z" />
                <circle cx="7.5" cy="17.5" r="1.5" />
                <circle cx="17.5" cy="17.5" r="1.5" />
            </svg>
        );
    }

    if (actionType.includes('refund')) {
        return (
            <svg {...commonProps}>
                <path d="M7 7h9a4 4 0 0 1 0 8H9" />
                <path d="m7 7 3-3" />
                <path d="m7 7 3 3" />
                <path d="M8 17h8" />
            </svg>
        );
    }

    if (actionType.includes('return')) {
        return (
            <svg {...commonProps}>
                <path d="M17 8V5H7v3" />
                <path d="M7 13v6h10v-6" />
                <path d="M3 11h12" />
                <path d="m3 11 3-3" />
                <path d="m3 11 3 3" />
            </svg>
        );
    }

    if (actionType.includes('status')) {
        return (
            <svg {...commonProps}>
                <circle cx="12" cy="12" r="8" />
                <path d="m9.5 12 1.7 1.7 3.3-3.7" />
            </svg>
        );
    }

    if (actionType.includes('cancellation')) {
        return (
            <svg {...commonProps}>
                <circle cx="12" cy="12" r="8" />
                <path d="m9 9 6 6" />
                <path d="m15 9-6 6" />
            </svg>
        );
    }

    if (actionType.includes('created')) {
        return (
            <svg {...commonProps}>
                <path d="M12 5v14" />
                <path d="M5 12h14" />
            </svg>
        );
    }

    if (actionType.includes('deleted')) {
        return (
            <svg {...commonProps}>
                <path d="M5 7h14" />
                <path d="M9 7V5h6v2" />
                <path d="M8 10v7" />
                <path d="M12 10v7" />
                <path d="M16 10v7" />
                <path d="M7 7l1 12h8l1-12" />
            </svg>
        );
    }

    if (entityKind === 'order') {
        return (
            <svg {...commonProps}>
                <path d="M7 5.5h10l1 3.5H6z" />
                <path d="M7 9h10v9.5H7z" />
                <path d="M10 13h4" />
            </svg>
        );
    }

    return (
        <svg {...commonProps}>
            <rect x="5" y="5" width="14" height="14" rx="2" />
            <path d="M9 9h6" />
            <path d="M9 13h6" />
            <path d="M9 17h4" />
        </svg>
    );
}

async function getDashboardData(): Promise<{
    analytics: DashboardAnalytics | null;
    error: ToastErrorPayload | null;
}> {
    const { status, body } = await handleGetDashboardAnalytics();
    if (status >= 200 && status < 300) {
        return {
            analytics: body as DashboardAnalytics,
            error: null,
        };
    }

    return {
        analytics: null,
        error: {
            message: 'Failed to load dashboard analytics',
            status,
            body,
            url: 'service:admin:dashboard:analytics',
            method: 'GET',
        },
    };
}

function buildDonutSegments(items: DashboardAnalytics['ordersByStatus']) {
    const total = items.reduce((sum, item) => sum + item.count, 0);
    let offset = 0;

    return items.map((item) => {
        const fraction = total > 0 ? item.count / total : 0;
        const dash = 2 * Math.PI * 42;
        const segmentLength = dash * fraction;
        const segment = {
            ...item,
            href: `/manage/orders?status=${encodeURIComponent(item.status)}`,
            strokeDasharray: `${segmentLength} ${dash - segmentLength}`,
            strokeDashoffset: -offset,
            color: getStatusColor(item.status),
        };
        offset += segmentLength;
        return segment;
    });
}

function buildTrendPolyline(points: DashboardAnalytics['salesTrend']) {
    const width = 760;
    const height = 240;
    const padding = 24;
    const usableWidth = width - padding * 2;
    const usableHeight = height - padding * 2;
    const maxValue = Math.max(...points.map((point) => point.totalAmount), 1);

    return points.map((point, index) => {
        const x = padding + (index / Math.max(points.length - 1, 1)) * usableWidth;
        const y = height - padding - (point.totalAmount / maxValue) * usableHeight;
        return { ...point, x, y };
    });
}

export default async function ManageDashboardPage() {
    const { analytics, error } = await getDashboardData();

    const ordersByStatus = analytics?.ordersByStatus ?? [];
    const salesTrend = analytics?.salesTrend ?? [];
    const recentActivity = analytics?.recentActivity ?? [];
    const totalOrders = ordersByStatus.reduce((sum, item) => sum + item.count, 0);
    const totalSales = salesTrend.reduce((sum, item) => sum + item.totalAmount, 0);
    const lastSevenDaysSales = salesTrend.slice(-7).reduce((sum, item) => sum + item.totalAmount, 0);
    const donutSegments = buildDonutSegments(ordersByStatus);
    const trendPoints = buildTrendPolyline(salesTrend);
    const trendPath = trendPoints.map((point) => `${point.x},${point.y}`).join(' ');
    const trendArea = trendPoints.length
        ? [
            `M ${trendPoints[0].x} ${240 - 24}`,
            ...trendPoints.map((point) => `L ${point.x} ${point.y}`),
            `L ${trendPoints[trendPoints.length - 1].x} ${240 - 24}`,
            'Z',
          ].join(' ')
        : '';

    return (
        <div className=" p-4 min-h-screen rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-base)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
            {error && <ErrorToastHandler error={error} />}

            <div className="space-y-6 p-5 sm:p-8 ">
                <section className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[linear-gradient(160deg,var(--bg-base)_0%,var(--bg-elevated)_58%,var(--bg-subtle)_100%)] p-6 sm:p-8">
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
                            <Card className="rounded-[var(--radius-md)] border-[var(--border-subtle)] bg-[var(--bg-base)] shadow-[var(--shadow-sm)]">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                                    Total orders
                                </p>
                                <p className="mt-3 text-3xl font-semibold">{totalOrders}</p>
                                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                                    Current count across every tracked order status.
                                </p>
                            </Card>
                            <Card className="rounded-[var(--radius-md)] border-[var(--border-subtle)] bg-[var(--bg-base)] shadow-[var(--shadow-sm)]">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                                    90-day sales
                                </p>
                                <p className="mt-3 text-3xl font-semibold">{formatCurrency(totalSales)}</p>
                                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                                    Successful order value aggregated from the last 90 days.
                                </p>
                            </Card>
                            <Card className="rounded-[var(--radius-md)] border-[var(--border-subtle)] bg-[var(--bg-base)] shadow-[var(--shadow-sm)]">
                                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
                                    Last 7 days
                                </p>
                                <p className="mt-3 text-3xl font-semibold">{formatCurrency(lastSevenDaysSales)}</p>
                                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                                    Recent sales momentum for operational planning.
                                </p>
                            </Card>
                        </div>
                    </div>
                </section>

                <section className="grid gap-6 xl:grid-cols-[0.95fr_1.35fr]">
                    <Card className="rounded-[var(--radius-md)] border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-sm)]">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-semibold">Orders by Status</h2>
                                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                    Circle breakdown of the live order pipeline.
                                </p>
                            </div>
                            <Link href="/manage/orders">
                                <Button variant="outline" size="sm">Open orders</Button>
                            </Link>
                        </div>

                        <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr] lg:items-center">
                            <div className="relative mx-auto flex h-[220px] w-[220px] items-center justify-center">
                                <svg width="220" height="220" viewBox="0 0 220 220" className="-rotate-90 overflow-visible">
                                    <circle
                                        cx="110"
                                        cy="110"
                                        r="42"
                                        fill="none"
                                        stroke="var(--border-subtle)"
                                        strokeWidth="28"
                                    />
                                    {donutSegments.map((segment) => (
                                        <a key={segment.status} href={segment.href}>
                                            <title>{`${formatStatus(segment.status)}: ${segment.count}`}</title>
                                            <circle
                                                cx="110"
                                                cy="110"
                                                r="42"
                                                fill="none"
                                                style={{ stroke: segment.color }}
                                                strokeWidth="28"
                                                strokeLinecap="butt"
                                                strokeDasharray={segment.strokeDasharray}
                                                strokeDashoffset={segment.strokeDashoffset}
                                            />
                                        </a>
                                    ))}
                                    <circle cx="110" cy="110" r="26" fill="var(--bg-elevated)" />
                                </svg>
                            </div>

                            <div className="space-y-3">
                                {ordersByStatus.length === 0 ? (
                                    <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] p-4 text-sm text-[var(--text-secondary)]">
                                        No order data yet.
                                    </div>
                                ) : (
                                    donutSegments.map((item) => (
                                        <Link
                                            key={item.status}
                                            href={`/manage/orders?status=${encodeURIComponent(item.status)}`}
                                            className="flex items-center justify-between gap-4 rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-4 py-3 transition-colors hover:border-[var(--border-strong)]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <span
                                                    className="h-3 w-3 rounded-full"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <span className="font-medium text-[var(--text-primary)]">{formatStatus(item.status)}</span>
                                            </div>
                                            <span className="text-sm text-[var(--text-secondary)]">{item.count}</span>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>
                    </Card>

                    <Card className="rounded-[var(--radius-md)] border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-sm)]">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-semibold">Purchase Trend</h2>
                                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                    Daily sales amount for the last 90 days.
                                </p>
                            </div>
                            <span className="rounded-full border border-[var(--border-subtle)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)]">
                                90 days
                            </span>
                        </div>

                        <div className="mt-6 overflow-x-auto">
                            <div className="min-w-[760px]">
                                <svg width="760" height="240" viewBox="0 0 760 240" className="w-full">
                                    {[0, 1, 2, 3].map((row) => {
                                        const y = 24 + row * 48;
                                        return (
                                            <line
                                                key={row}
                                                x1="24"
                                                y1={y}
                                                x2="736"
                                                y2={y}
                                                stroke="var(--border-subtle)"
                                                strokeDasharray="4 6"
                                            />
                                        );
                                    })}
                                    {trendArea && (
                                        <path d={trendArea} fill="var(--bg-subtle)" />
                                    )}
                                    {trendPath && (
                                        <polyline
                                            fill="none"
                                            stroke="var(--text-primary)"
                                            strokeWidth="3"
                                            points={trendPath}
                                        />
                                    )}
                                    {trendPoints.filter((_, index) => index % 15 === 0 || index === trendPoints.length - 1).map((point) => (
                                        <g key={point.date}>
                                            <circle cx={point.x} cy={point.y} r="3.5" fill="var(--text-primary)" />
                                            <text
                                                x={point.x}
                                                y="232"
                                                textAnchor="middle"
                                                fill="var(--text-muted)"
                                                fontSize="10"
                                            >
                                                {formatDateLabel(point.date)}
                                            </text>
                                        </g>
                                    ))}
                                </svg>
                            </div>
                        </div>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            {salesTrend.slice(-3).map((point) => (
                                <div
                                    key={point.date}
                                    className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-4 py-3"
                                >
                                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                        {formatDateLabel(point.date)}
                                    </p>
                                    <p className="mt-2 text-lg font-semibold text-[var(--text-primary)]">
                                        {formatCurrency(point.totalAmount)}
                                    </p>
                                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                        {point.orderCount} successful orders
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Card>
                </section>

                <section>
                    <Card className="rounded-[var(--radius-md)] border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-sm)]">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-semibold">Recent Activity</h2>
                                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                                    Latest admin and customer events with drill-down details.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            {recentActivity.length === 0 ? (
                                <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-subtle)] p-5 text-sm text-[var(--text-secondary)]">
                                    No activity recorded yet.
                                </div>
                            ) : (
                                recentActivity.map((activity) => {
                                    const tone = getActivityTone(activity.actionType);
                                    const toneClasses = getActivityToneClasses(tone);

                                    return (
                                        <Link
                                            key={activity.id}
                                            href={`/manage/activity/${activity.id}`}
                                            className="group block rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-4 py-4 transition-all hover:border-[var(--border-strong)] hover:shadow-[var(--shadow-sm)] sm:px-5"
                                        >
                                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                <div className="flex gap-3 sm:gap-4">
                                                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] border ${toneClasses}`}>
                                                        <ActivityIcon
                                                            actionType={activity.actionType}
                                                            entityKind={activity.primaryEntity.kind}
                                                            className="h-5 w-5"
                                                        />
                                                    </div>

                                                    <div className="min-w-0 space-y-3">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${toneClasses}`}>
                                                                {formatActionLabel(activity.actionType)}
                                                            </span>
                                                            <span className="inline-flex rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">
                                                                {formatActorLabel(activity.actor.displayName, activity.actor.type)}
                                                            </span>
                                                        </div>

                                                        <p className="text-sm font-semibold leading-6 text-[var(--text-primary)] sm:text-base">
                                                            {activity.summary}
                                                        </p>

                                                        <div className="flex flex-wrap gap-2 text-sm">
                                                            <span className="inline-flex rounded-full border border-[var(--border-subtle)] bg-[var(--bg-elevated)] px-3 py-1 text-[var(--text-primary)]">
                                                                {activity.primaryEntity.label}
                                                            </span>
                                                            {activity.diff && activity.diff.length > 0 && (
                                                                <span className="inline-flex rounded-full border border-[var(--border-subtle)] px-3 py-1 text-[var(--text-secondary)]">
                                                                    {activity.diff.length} field changes
                                                                </span>
                                                            )}
                                                            {activity.details && Object.keys(activity.details).length > 0 && (
                                                                <span className="inline-flex rounded-full border border-[var(--border-subtle)] px-3 py-1 text-[var(--text-secondary)]">
                                                                    {Object.keys(activity.details).length} detail items
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="pl-14 text-sm text-[var(--text-secondary)] lg:pl-0 lg:text-right">
                                                    <span className="block font-medium text-[var(--text-primary)]">
                                                        {new Intl.DateTimeFormat('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                        }).format(new Date(activity.createdAt))}
                                                    </span>
                                                    <span className="mt-1 block text-xs uppercase tracking-[0.14em] text-[var(--text-muted)]">
                                                        {new Intl.DateTimeFormat('en-US', {
                                                            hour: 'numeric',
                                                            minute: '2-digit',
                                                        }).format(new Date(activity.createdAt))}
                                                    </span>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })
                            )}
                        </div>
                    </Card>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    {[
                        {
                            title: 'Add product',
                            description: 'Create a new catalog entry with variants and media.',
                            href: '/manage/products/new',
                        },
                        {
                            title: 'Review orders',
                            description: 'Process status changes, shipping, and support actions.',
                            href: '/manage/orders',
                        },
                        {
                            title: 'Bulk price update',
                            description: 'Apply controlled price movements with a logged activity trail.',
                            href: '/manage/products/bulk-price-update',
                        },
                    ].map((action) => (
                        <Card key={action.href} className="rounded-[var(--radius-md)] border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-sm)]">
                            <h3 className="text-lg font-semibold text-[var(--text-primary)]">{action.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">{action.description}</p>
                            <Link href={action.href} className="mt-4 inline-flex">
                                <Button variant="outline" size="sm">
                                    Open
                                </Button>
                            </Link>
                        </Card>
                    ))}
                </section>
            </div>
        </div>
    );
}
