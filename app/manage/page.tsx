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

async function getDashboardStats(): Promise<DashboardStats> {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const [ordersResult, productsResult, categoriesResult, variantsResult] = await Promise.all([
        fetchStat(`${baseUrl}/api/admin/orders?limit=1`, 'orders', data =>
            typeof data?.pagination?.total === 'number' ? data.pagination.total : null
        ),
        fetchStat(`${baseUrl}/api/products?limit=1`, 'products', data =>
            typeof data?.pagination?.total === 'number' ? data.pagination.total : null
        ),
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
        <div className="min-h-screen bg-[var(--bg-base)] text-[var(--text-primary)]">
            {stats.error && <ErrorToastHandler error={stats.error} />}
            <div className="container mx-auto px-4 py-10 max-w-6xl space-y-10">
                <div className="space-y-3">
                    <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[var(--text-secondary)]">
                        Admin dashboard
                    </p>
                    <h1 className="text-4xl font-bold">ShezaStar Control Center</h1>
                    <p className="text-lg text-[var(--text-secondary)] max-w-3xl">
                        Monitor storefront health, curate the product catalog, and keep orders moving without
                        jumping between multiple tools.
                    </p>
                </div>

                <section className="grid gap-4 md:grid-cols-2">
                    {statItems.map((item) => (
                        <Card key={item.label} className="flex flex-col gap-4">
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
                            <Button variant="ghost" size="sm">
                                Open settings
                            </Button>
                        </Link>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        {QUICK_ACTIONS.map((action) => (
                            <Card key={action.title} className="flex flex-col justify-between gap-4">
                                <div>
                                    <p className="text-sm uppercase tracking-[0.2em] text-[var(--text-muted)]">
                                        {action.title}
                                    </p>
                                    <p className="text-lg font-semibold text-[var(--text-primary)] mt-2">
                                        {action.description}
                                    </p>
                                </div>
                                <Link href={action.href} className="self-start">
                                    <Button variant="primary" size="sm">
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
