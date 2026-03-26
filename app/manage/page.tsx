import Link from 'next/link';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorToastHandler, type ToastErrorPayload } from '@/components/ErrorToastHandler';

const QUICK_ACTIONS = [
    {
        title: 'Add a product',
        description: 'Create new catalog entries and upload images.',
        href: '/manage/products/new',
        actionLabel: 'Create Product',
    },
    {
        title: 'Review orders',
        description: 'Fulfill or cancel orders and monitor customer progress.',
        href: '/manage/orders',
        actionLabel: 'View Orders',
    },
    {
        title: 'Organize categories',
        description: 'Manage categories, subcategories, and hierarchy.',
        href: '/manage/categories',
        actionLabel: 'Open Categories',
    },
    {
        title: 'Update settings',
        description: 'Tweak featured products, hero banners, and custom cards.',
        href: '/manage/settings',
        actionLabel: 'Open Settings',
    },
    {
        title: 'Bulk price update',
        description: 'Update prices in bulk by category, product, or all at once.',
        href: '/manage/products/bulk-price-update',
        actionLabel: 'Update Prices',
    },
];

type DashboardStats = {
    orders: number | null;
    products: number | null;
    categories: number | null;
    variantTypes: number | null;
    error: ToastErrorPayload | null;
};

type StatFetchResult = {
    value: number | null;
    error: ToastErrorPayload | null;
};

type PaginatedResponse = {
    pagination?: {
        total?: number;
    };
};

async function getDashboardStats(): Promise<DashboardStats> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const [ordersResult, productsResult, categoriesResult, variantsResult] = await Promise.all([
        fetchStat(`${baseUrl}/api/admin/orders?limit=1`, 'orders', (data: unknown) => {
            const response = data as PaginatedResponse;
            return typeof response?.pagination?.total === 'number' ? response.pagination.total : null;
        }),
        fetchStat(`${baseUrl}/api/products?limit=1`, 'products', (data: unknown) => {
            const response = data as PaginatedResponse;
            return typeof response?.pagination?.total === 'number' ? response.pagination.total : null;
        }),
        fetchStat(`${baseUrl}/api/categories`, 'categories', data =>
            Array.isArray(data) ? data.length : null
        ),
        fetchStat(`${baseUrl}/api/variant-types`, 'variant types', data =>
            Array.isArray(data) ? data.length : null
        ),
    ]);

    const firstError =
        ordersResult.error || productsResult.error || categoriesResult.error || variantsResult.error || null;

    return {
        orders: ordersResult.value,
        products: productsResult.value,
        categories: categoriesResult.value,
        variantTypes: variantsResult.value,
        error: firstError,
    };
}

async function fetchStat(
    url: string,
    label: string,
    transform: (payload: unknown) => number | null
): Promise<StatFetchResult> {
    try {
        const response = await fetch(url, { cache: 'no-store' });
        const body = await safeParseJson(response);

        if (!response.ok) {
            return {
                value: null,
                error: buildErrorPayload(
                    label,
                    response.status,
                    body,
                    response.url,
                    'GET'
                ),
            };
        }

        return {
            value: transform(body),
            error: null,
        };
    } catch (error) {
        const payload: ToastErrorPayload = {
            message: `Unable to load ${label}`,
            body: error instanceof Error ? { message: error.message, stack: error.stack } : { error },
            url,
            method: 'GET',
        };
        return { value: null, error: payload };
    }
}

async function safeParseJson(response: Response) {
    try {
        return await response.json();
    } catch {
        return { error: 'Failed to parse response body' };
    }
}

function buildErrorPayload(
    label: string,
    status: number,
    body: unknown,
    url: string,
    method: string
): ToastErrorPayload {
    return {
        message: `Failed to load ${label}`,
        status,
        body,
        url,
        method,
    };
}

export default async function ManageDashboardPage() {
    const stats = await getDashboardStats();
    const statItems = [
        {
            label: 'Orders',
            value: stats.orders,
            helper: 'Total orders in the system',
            link: '/manage/orders',
        },
        {
            label: 'Products',
            value: stats.products,
            helper: 'Products available to customers',
            link: '/manage/products',
        },
        {
            label: 'Categories',
            value: stats.categories,
            helper: 'Organized product categories',
            link: '/manage/categories',
        },
        {
            label: 'Variant types',
            value: stats.variantTypes,
            helper: 'Attribute groups available in catalog',
            link: '/manage/variant-types',
        },
    ];

    return (
        <div className="min-h-screen rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-base)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
            {stats.error && <ErrorToastHandler error={stats.error} />}
            <div className="space-y-8 p-5 sm:p-8">
                <section className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[linear-gradient(135deg,var(--bg-base)_0%,var(--bg-elevated)_55%,var(--bg-subtle)_100%)]">
                    <div className="grid gap-8 p-6 lg:grid-cols-[1.6fr_0.9fr] lg:p-8">
                        <div className="space-y-5">
                            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-base)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.26em] text-[var(--text-secondary)]">
                                <span className="h-2 w-2 rounded-full bg-[var(--text-primary)]" />
                                Admin dashboard
                            </div>
                            <div className="space-y-3">
                                <h1 className="max-w-3xl text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
                                    Run the admin panel from one clean control surface.
                                </h1>
                                <p className="max-w-2xl text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
                                    The navigation now lives on the right, quick actions stay one click away, and the dashboard surfaces use tighter corners for a cleaner operating feel.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link href="/manage/products/new">
                                    <Button variant="primary" className="rounded-[var(--radius-md)]">
                                        Add product
                                    </Button>
                                </Link>
                                <Link href="/manage/orders">
                                    <Button variant="outline" className="rounded-[var(--radius-md)]">
                                        Review orders
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                            <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-base)] p-4 shadow-[var(--shadow-sm)]">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                                    Catalog
                                </p>
                                <p className="mt-3 text-3xl font-semibold">{stats.products ?? '—'}</p>
                                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                                    Active products currently available in the storefront.
                                </p>
                            </div>
                            <div className="rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-base)] p-4 shadow-[var(--shadow-sm)]">
                                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                                    Operations
                                </p>
                                <p className="mt-3 text-3xl font-semibold">{stats.orders ?? '—'}</p>
                                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                                    Orders in the system ready for review, shipping, or support.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {statItems.map((item) => (
                        <Card key={item.label} className="flex flex-col gap-4 rounded-[var(--radius-md)] border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-sm)]">
                            <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
                                <span>{item.label}</span>
                                <span className="font-mono text-xs text-[var(--text-muted)]">
                                    {item.value === null ? '—' : 'Updated now'}
                                </span>
                            </div>
                            <div className="text-4xl font-bold">
                                {item.value ?? '—'}
                            </div>
                            <p className="text-sm text-[var(--text-secondary)]">{item.helper}</p>
                            <Link href={item.link} className="self-start">
                                <Button variant="outline" size="sm">
                                    Manage {item.label}
                                </Button>
                            </Link>
                        </Card>
                    ))}
                </section>

                <section className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-semibold">Quick actions</h2>
                        <Link href="/manage/settings">
                            <Button variant="ghost" size="sm" className="rounded-[var(--radius-md)]">
                                Open settings
                            </Button>
                        </Link>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        {QUICK_ACTIONS.map((action) => (
                            <Card key={action.title} className="flex flex-col justify-between gap-4 rounded-[var(--radius-md)] border-[var(--border-subtle)] bg-[var(--bg-elevated)] shadow-[var(--shadow-sm)]">
                                <div>
                                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">
                                        {action.title}
                                    </p>
                                    <p className="text-lg font-semibold text-[var(--text-primary)] mt-2">
                                        {action.description}
                                    </p>
                                </div>
                                <Link href={action.href} className="self-start">
                                    <Button variant="primary" size="sm" className="rounded-[var(--radius-md)]">
                                        {action.actionLabel}
                                    </Button>
                                </Link>
                            </Card>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
