import Link from 'next/link';

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ErrorToastHandler, type ToastErrorPayload } from '@/components/ErrorToastHandler';
import { handleGetDashboardAnalytics } from '@/lib/activity/activity.controller';
import type { DashboardAnalytics } from '@/lib/activity/model/activity.model';

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

function formatDateTime(date: string) {
    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(date));
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

    return items.map((item, index) => {
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
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-secondary)]">
                                <span className="h-2 w-2 rounded-full bg-[var(--text-primary)]" />
                                Admin analytics
                            </div>
                            <div className="space-y-2">
                                <h1 className="text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
                                    Watch sales, order pressure, and every operator action from one view.
                                </h1>
                                <p className="max-w-3xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
                                    The dashboard now prioritizes live order distribution, 90-day purchase movement, and a traceable activity stream for product and order operations.
                                </p>
                            </div>
                        </div>

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
                                recentActivity.map((activity) => (
                                    <Link
                                        key={activity.id}
                                        href={`/manage/activity/${activity.id}`}
                                        className="block rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-base)] px-5 py-4 transition-colors hover:border-[var(--border-strong)]"
                                    >
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                            <div className="space-y-2">
                                                <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                                                    <span>{activity.actor.displayName || activity.actor.type}</span>
                                                    <span className="h-1 w-1 rounded-full bg-[var(--text-muted)]" />
                                                    <span>{activity.actionType}</span>
                                                </div>
                                                <p className="text-base font-medium text-[var(--text-primary)]">
                                                    {activity.summary}
                                                </p>
                                                <div className="flex flex-wrap gap-2 text-sm text-[var(--text-secondary)]">
                                                    <span>{activity.primaryEntity.label}</span>
                                                    {activity.diff && activity.diff.length > 0 && (
                                                        <span>{activity.diff.length} field changes</span>
                                                    )}
                                                    {activity.details && Object.keys(activity.details).length > 0 && (
                                                        <span>{Object.keys(activity.details).length} detail items</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-sm text-[var(--text-secondary)]">
                                                {formatDateTime(activity.createdAt)}
                                            </div>
                                        </div>
                                    </Link>
                                ))
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
