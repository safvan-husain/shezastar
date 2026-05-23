import { afterEach, describe, expect, it, vi } from 'vitest';
import {
    STATIC_SITEMAP_PATHS,
    buildCanonicalUrl,
    buildCategoryCanonicalUrl,
    buildProductCanonicalUrl,
    getSiteUrl,
} from '@/lib/seo/canonical';

describe('SEO canonical helpers', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('uses metadata base default URL when env vars are absent', () => {
        vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
        vi.stubEnv('SITE_URL', '');

        expect(getSiteUrl().toString()).toBe('https://shezastar.com/');
    });

    it('builds product, category, and static canonical URLs', () => {
        expect(buildProductCanonicalUrl('abc123')).toBe('https://shezastar.com/product/abc123');
        expect(buildCategoryCanonicalUrl('audio-accessories')).toBe('https://shezastar.com/category/audio-accessories');
        expect(buildCanonicalUrl('/aboutus')).toBe('https://shezastar.com/aboutus');
    });

    it('contains required static sitemap paths', () => {
        expect(STATIC_SITEMAP_PATHS).toEqual([
            '/',
            '/aboutus',
            '/contact-us',
            '/privacy-policy',
            '/terms-and-conditions',
            '/return-refund-policy',
            '/products',
            '/blogs',
            '/category',
        ]);
    });
});
