import { describe, expect, it, vi } from 'vitest';

const getCachedProductIds = vi.fn();
const getCachedAllCategories = vi.fn();
const getCachedPublishedBlogSitemapEntries = vi.fn();

vi.mock('@/lib/product/product-cache', () => ({
    getCachedProductIds,
}));

vi.mock('@/lib/category/category-cache', () => ({
    getCachedAllCategories,
}));

vi.mock('@/lib/blog/blog-cache', () => ({
    getCachedPublishedBlogSitemapEntries,
}));

describe('sitemap generation', () => {
    it('includes static, product, category, and blog URLs', async () => {
        getCachedProductIds.mockResolvedValue(['prod-1', 'prod-2']);
        getCachedPublishedBlogSitemapEntries.mockResolvedValue([
            { slug: 'test-blog', updatedAt: '2026-01-16T00:00:00.000Z' },
        ]);
        getCachedAllCategories.mockResolvedValue([
            {
                id: 'cat-1',
                name: 'Audio',
                slug: 'audio',
                subCategories: [
                    {
                        id: 'sub-1',
                        name: 'Speakers',
                        slug: 'audio-speakers',
                        subSubCategories: [
                            {
                                id: 'leaf-1',
                                name: 'Bluetooth',
                                slug: 'audio-speakers-bluetooth',
                            },
                        ],
                    },
                ],
                createdAt: '2026-01-01T00:00:00.000Z',
                updatedAt: '2026-01-01T00:00:00.000Z',
            },
        ]);

        const { default: sitemap } = await import('@/app/sitemap');
        const entries = await sitemap();
        const urls = entries.map(entry => entry.url);

        expect(urls).toContain('https://shezastar.com/');
        expect(urls).toContain('https://shezastar.com/products');
        expect(urls).toContain('https://shezastar.com/product/prod-1');
        expect(urls).toContain('https://shezastar.com/product/prod-2');
        expect(urls).toContain('https://shezastar.com/category/audio');
        expect(urls).toContain('https://shezastar.com/category/audio-speakers');
        expect(urls).toContain('https://shezastar.com/category/audio-speakers-bluetooth');
        expect(urls).toContain('https://shezastar.com/blogs/test-blog');
        expect(entries.every(entry => entry.lastModified instanceof Date)).toBe(true);
    });
});
