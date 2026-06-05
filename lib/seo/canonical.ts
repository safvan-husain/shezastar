const DEFAULT_SITE_URL = 'https://shezastar.com';

export const STATIC_SITEMAP_PATHS = [
    '/',
    '/aboutus',
    '/contact-us',
    '/privacy-policy',
    '/terms-and-conditions',
    '/return-refund-policy',
    '/products',
    '/blogs',
    '/category',
] as const;

function normalizePath(pathname: string) {
    if (!pathname) {
        return '/';
    }

    return pathname.startsWith('/') ? pathname : `/${pathname}`;
}

export function getSiteUrl() {
    const configured =
        process.env.NEXT_PUBLIC_SITE_URL ||
        process.env.SITE_URL ||
        DEFAULT_SITE_URL;

    return new URL(configured);
}

export function buildCanonicalUrl(pathname: string) {
    return new URL(normalizePath(pathname), getSiteUrl()).toString();
}

export function buildProductPath(productSlug: string) {
    return `/product/${encodeURIComponent(productSlug)}`;
}

export function buildCategoryPath(slug: string) {
    return `/category/${encodeURIComponent(slug)}`;
}

export function buildProductCanonicalUrl(productSlug: string) {
    return buildCanonicalUrl(buildProductPath(productSlug));
}

export function buildCategoryCanonicalUrl(slug: string) {
    return buildCanonicalUrl(buildCategoryPath(slug));
}

export function buildBlogPath(slug: string) {
    return `/blogs/${encodeURIComponent(slug)}`;
}

export function buildBlogCanonicalUrl(slug: string) {
    return buildCanonicalUrl(buildBlogPath(slug));
}

export const STATIC_PAGE_PATHS = {
    home: '/',
    about: '/aboutus',
    contact: '/contact-us',
    privacy: '/privacy-policy',
    terms: '/terms-and-conditions',
    'return-refund': '/return-refund-policy',
    products: '/products',
    blogs: '/blogs',
    'category-landing': '/category',
} as const;

export type StaticPagePathKey = keyof typeof STATIC_PAGE_PATHS;

export function buildStaticPagePath(key: StaticPagePathKey) {
    return STATIC_PAGE_PATHS[key];
}
