'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';

import { useToast } from '@/components/ui/Toast';

type IconProps = {
    className?: string;
};

type NavLinkItem = {
    type: 'link';
    href: string;
    label: string;
    shortLabel: string;
    Icon: ({ className }: IconProps) => React.JSX.Element;
};

type NavGroupItem = {
    type: 'group';
    id: 'products' | 'settings';
    label: string;
    shortLabel: string;
    href: string;
    Icon: ({ className }: IconProps) => React.JSX.Element;
    children: Array<{
        href: string;
        label: string;
    }>;
};

type NavItem = NavLinkItem | NavGroupItem;

const DashboardIcon = ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="4" rx="1.5" />
        <rect x="14" y="10" width="7" height="11" rx="1.5" />
        <rect x="3" y="13" width="7" height="8" rx="1.5" />
    </svg>
);

const ProductIcon = ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 8.5L12 3 3 8.5 12 14z" />
        <path d="M3 8.5V16l9 5 9-5V8.5" />
        <path d="M12 14v7" />
    </svg>
);

const CategoryIcon = ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4 6h7v5H4z" />
        <path d="M13 6h7v5h-7z" />
        <path d="M4 13h7v5H4z" />
        <path d="M13 13h7v5h-7z" />
    </svg>
);

const BrandIcon = ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M6 4h8l4 4v12H6z" />
        <path d="M14 4v4h4" />
        <path d="M9 13h6" />
        <path d="M9 17h4" />
    </svg>
);

const VariantIcon = ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="7" cy="12" r="3" />
        <circle cx="17" cy="7" r="3" />
        <circle cx="17" cy="17" r="3" />
        <path d="M10 12h4" />
        <path d="M15 9.5v5" />
    </svg>
);

const OrdersIcon = ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M7 4h10l1 4H6z" />
        <path d="M6 8h12l-1 11H7z" />
        <path d="M9 12h6" />
        <path d="M10 16h4" />
    </svg>
);

const SettingsIcon = ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a2 2 0 1 1-4 0v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1 .2l-.1.1a2 2 0 0 1-2.9-2.8l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a2 2 0 1 1 0-4h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1l-.1-.1a2 2 0 1 1 2.8-2.9l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a2 2 0 1 1 4 0v.2a1 1 0 0 0 .7.9 1 1 0 0 0 1-.2l.1-.1a2 2 0 0 1 2.9 2.8l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6h.2a2 2 0 1 1 0 4h-.2a1 1 0 0 0-.9.7" />
    </svg>
);

const BackupIcon = ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M12 3v11" />
        <path d="m8 10 4 4 4-4" />
        <path d="M5 16v2a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-2" />
    </svg>
);

const CollapseIcon = ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M15 18l-6-6 6-6" />
    </svg>
);

const ExpandIcon = ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M9 18l6-6-6-6" />
    </svg>
);

const ChevronDownIcon = ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="m6 9 6 6 6-6" />
    </svg>
);

const CloseIcon = ({ className }: IconProps) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M6 6l12 12" />
        <path d="M18 6 6 18" />
    </svg>
);

const NAV_ITEMS: NavItem[] = [
    { type: 'link', href: '/manage', label: 'Dashboard', shortLabel: 'Dash', Icon: DashboardIcon },
    {
        type: 'group',
        id: 'products',
        href: '/manage/products',
        label: 'Products',
        shortLabel: 'Prod',
        Icon: ProductIcon,
        children: [
            { href: '/manage/products', label: 'View products' },
            { href: '/manage/products/new', label: 'Add product' },
            { href: '/manage/products/bulk-price-update', label: 'Update bulk' },
        ],
    },
    { type: 'link', href: '/manage/categories', label: 'Categories', shortLabel: 'Cats', Icon: CategoryIcon },
    { type: 'link', href: '/manage/brands', label: 'Brands', shortLabel: 'Brand', Icon: BrandIcon },
    { type: 'link', href: '/manage/variant-types', label: 'Variant Types', shortLabel: 'Vars', Icon: VariantIcon },
    { type: 'link', href: '/manage/orders', label: 'Orders', shortLabel: 'Orders', Icon: OrdersIcon },
    {
        type: 'group',
        id: 'settings',
        href: '/manage/settings',
        label: 'Settings',
        shortLabel: 'Setup',
        Icon: SettingsIcon,
        children: [
            { href: '/manage/settings/hero-banners', label: 'Hero banners' },
            { href: '/manage/settings/custom-cards', label: 'Custom cards' },
            { href: '/manage/settings/featured-products', label: 'Featured products' },
            { href: '/manage/settings/installation-locations', label: 'Installation locations' },
            { href: '/manage/settings/countries', label: 'Countries & taxes' },
        ],
    },
];

type NavPanelProps = {
    collapsed: boolean;
    pathname: string | null;
    onNavigate?: () => void;
    onToggleCollapse?: () => void;
    isBackingUp: boolean;
    onBackup: () => Promise<void>;
};

type OpenGroups = Record<'products' | 'settings', boolean>;

function isPathActive(pathname: string | null, href: string) {
    return pathname === href || pathname?.startsWith(`${href}/`) || false;
}

async function safeParseBody(response: Response) {
    try {
        return await response.json();
    } catch {
        return { error: 'Failed to parse response body' };
    }
}

function RailContent({
    collapsed,
    pathname,
    onNavigate,
    onToggleCollapse,
    isBackingUp,
    onBackup,
}: NavPanelProps) {
    const [openGroups, setOpenGroups] = useState<OpenGroups>({
        products: false,
        settings: false,
    });

    const toggleGroup = (id: keyof OpenGroups) => {
        setOpenGroups((current) => ({
            ...current,
            [id]: !current[id],
        }));
    };

    const baseRowClass =
        'group flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-3 text-sm font-medium transition-all';

    return (
        <div className="flex h-full flex-col bg-[var(--bg-elevated)]">
            <div className={`flex items-center gap-3 px-3 py-4 ${collapsed ? 'justify-center' : ''}`}>
                <div className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--bg-base)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]">
                    <DashboardIcon className="h-5 w-5" />
                </div>
                {!collapsed && (
                    <div className="min-w-0">
                        <p className="text-base font-semibold tracking-[-0.02em] text-[var(--text-primary)]">ShezaStar</p>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-4">
                <div className="space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const topLevelActive = isPathActive(pathname, item.href);

                        if (item.type === 'link') {
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    onClick={onNavigate}
                                    aria-current={topLevelActive ? 'page' : undefined}
                                    aria-label={collapsed ? item.label : undefined}
                                    title={collapsed ? item.label : undefined}
                                    className={`${baseRowClass} ${collapsed ? 'justify-center' : ''} ${topLevelActive
                                        ? 'bg-[var(--bg-base)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
                                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-base)] hover:text-[var(--text-primary)]'
                                        }`}
                                >
                                    <item.Icon className="h-5 w-5 flex-shrink-0" />
                                    {!collapsed && <span className="min-w-0 truncate text-[15px]">{item.label}</span>}
                                    {collapsed && <span className="sr-only">{item.shortLabel}</span>}
                                </Link>
                            );
                        }

                        if (collapsed) {
                            return (
                                <Link
                                    key={item.id}
                                    href={item.href}
                                    onClick={onNavigate}
                                    aria-current={topLevelActive ? 'page' : undefined}
                                    aria-label={item.label}
                                    title={item.label}
                                    className={`${baseRowClass} justify-center ${topLevelActive
                                        ? 'bg-[var(--bg-base)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
                                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-base)] hover:text-[var(--text-primary)]'
                                        }`}
                                >
                                    <item.Icon className="h-5 w-5 flex-shrink-0" />
                                    <span className="sr-only">{item.shortLabel}</span>
                                </Link>
                            );
                        }

                        const childActive = item.children.some((child) => isPathActive(pathname, child.href));
                        const isOpen = openGroups[item.id];

                        return (
                            <div key={item.id} className="rounded-[var(--radius-md)]">
                                <button
                                    type="button"
                                    onClick={() => toggleGroup(item.id)}
                                    aria-expanded={isOpen}
                                    className={`${baseRowClass} justify-between ${topLevelActive || childActive
                                        ? 'bg-[var(--bg-base)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]'
                                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-base)] hover:text-[var(--text-primary)]'
                                        }`}
                                >
                                    <span className="flex min-w-0 items-center gap-3">
                                        <item.Icon className="h-5 w-5 flex-shrink-0" />
                                        <span className="min-w-0 truncate text-[15px]">{item.label}</span>
                                    </span>
                                    <ChevronDownIcon
                                        className={`h-4 w-4 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                <div
                                    className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <div className="mt-1 space-y-1 pl-8">
                                        {item.children.map((child) => {
                                            const active = isPathActive(pathname, child.href);

                                            return (
                                                <Link
                                                    key={child.href}
                                                    href={child.href}
                                                    onClick={onNavigate}
                                                    aria-current={active ? 'page' : undefined}
                                                    className={`flex items-center rounded-[var(--radius-sm)] px-3 py-2.5 text-sm transition-colors ${active
                                                        ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)]'
                                                        : 'text-[var(--text-secondary)] hover:bg-[var(--bg-base)] hover:text-[var(--text-primary)]'
                                                        }`}
                                                >
                                                    {child.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="space-y-1 px-3 py-4">
                <button
                    type="button"
                    onClick={onBackup}
                    disabled={isBackingUp}
                    aria-label={collapsed ? 'Download backup' : undefined}
                    title={collapsed ? 'Download backup' : undefined}
                    className={`${baseRowClass} ${collapsed ? 'justify-center' : ''} text-[var(--text-secondary)] hover:bg-[var(--bg-base)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60`}
                >
                    <BackupIcon className="h-5 w-5 flex-shrink-0" />
                    {!collapsed && <span>{isBackingUp ? 'Preparing backup...' : 'Download backup'}</span>}
                </button>

                {onToggleCollapse && (
                    <button
                        type="button"
                        onClick={onToggleCollapse}
                        aria-label={collapsed ? 'Expand navigation panel' : 'Collapse navigation panel'}
                        className={`${baseRowClass} ${collapsed ? 'justify-center' : ''} text-[var(--text-secondary)] hover:bg-[var(--bg-base)] hover:text-[var(--text-primary)]`}
                    >
                        {collapsed ? <ExpandIcon className="h-5 w-5 flex-shrink-0" /> : <CollapseIcon className="h-5 w-5 flex-shrink-0" />}
                        {!collapsed && <span>Shrink panel</span>}
                    </button>
                )}
            </div>
        </div>
    );
}

export default function AdminNavbar() {
    const pathname = usePathname();
    const { showToast } = useToast();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isBackingUp, setIsBackingUp] = useState(false);

    const desktopWidthClass = useMemo(
        () => (isCollapsed ? 'lg:w-[5.75rem]' : 'lg:w-[20rem]'),
        [isCollapsed]
    );

    const handleBackup = async () => {
        if (isBackingUp) return;

        setIsBackingUp(true);

        try {
            const response = await fetch('/api/manage/backup');

            if (!response.ok) {
                const body = await safeParseBody(response);

                if (response.status === 401) {
                    window.location.href = '/login';
                    return;
                }

                showToast(body?.message ?? body?.error ?? 'Failed to download backup', 'error', {
                    status: response.status,
                    body,
                    url: response.url,
                    method: 'GET',
                });
                return;
            }

            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `mongodb-backup-${new Date().toISOString().replace(/[:.]/g, '-')}.archive.gz`;

            if (contentDisposition && contentDisposition.includes('filename=')) {
                filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');

            anchor.href = url;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to download backup', 'error', {
                body: error instanceof Error ? { message: error.message, stack: error.stack } : { error },
                url: '/api/manage/backup',
                method: 'GET',
            });
        } finally {
            setIsBackingUp(false);
        }
    };

    return (
        <>
            <aside className={`sticky top-3 hidden self-start lg:block ${desktopWidthClass}`}>
                <div className="overflow-hidden rounded-[var(--radius-md)] bg-[linear-gradient(180deg,var(--bg-elevated)_0%,var(--bg-subtle)_100%)] shadow-[var(--shadow-md)]">
                    <RailContent
                        key={`${pathname ?? 'root'}-${isCollapsed ? 'collapsed' : 'expanded'}-desktop`}
                        collapsed={isCollapsed}
                        pathname={pathname}
                        onToggleCollapse={() => setIsCollapsed((value) => !value)}
                        isBackingUp={isBackingUp}
                        onBackup={handleBackup}
                    />
                </div>
            </aside>

            <button
                type="button"
                onClick={() => setIsMobileOpen(true)}
                className="fixed bottom-4 left-4 z-40 inline-flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-[var(--shadow-md)] lg:hidden"
                aria-label="Open admin navigation"
            >
                <DashboardIcon className="h-5 w-5" />
            </button>

            {isMobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        className="absolute inset-0 bg-black/40"
                        aria-label="Close admin navigation"
                        onClick={() => setIsMobileOpen(false)}
                    />
                    <div className="absolute left-0 top-0 h-full w-[20rem] max-w-[88vw] bg-[linear-gradient(180deg,var(--bg-elevated)_0%,var(--bg-subtle)_100%)] p-3 shadow-[var(--shadow-md)]">
                        <div className="mb-3 flex items-center justify-end">
                            <button
                                type="button"
                                onClick={() => setIsMobileOpen(false)}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--bg-base)] text-[var(--text-secondary)]"
                                aria-label="Close navigation panel"
                            >
                                <CloseIcon className="h-[18px] w-[18px]" />
                            </button>
                        </div>
                        <div className="h-[calc(100%-3.25rem)] overflow-hidden rounded-[var(--radius-md)] bg-[var(--bg-elevated)]">
                            <RailContent
                                key={`${pathname ?? 'root'}-mobile`}
                                collapsed={false}
                                pathname={pathname}
                                onNavigate={() => setIsMobileOpen(false)}
                                isBackingUp={isBackingUp}
                                onBackup={handleBackup}
                            />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
