import { describe, expect, it, vi } from 'vitest';

const getCachedPublishedBlogBySlug = vi.fn();

vi.mock('@/lib/blog/blog-cache', () => ({
    getCachedPublishedBlogBySlug,
    getCachedPublishedBlogSlugs: vi.fn().mockResolvedValue([]),
}));

describe('blog detail metadata', () => {
    it('includes canonical, article OG tags, and cover image', async () => {
        getCachedPublishedBlogBySlug.mockResolvedValue({
            id: 'blog-1',
            title: 'Test Blog',
            slug: 'test-blog',
            excerpt: 'A short excerpt for the blog post.',
            content: '<p>Body</p>',
            coverImageUrl: '/uploads/test-blog-cover.jpg',
            status: 'published',
            publishedAt: '2026-01-15T00:00:00.000Z',
            createdAt: '2026-01-10T00:00:00.000Z',
            updatedAt: '2026-01-16T00:00:00.000Z',
        });

        const { generateMetadata } = await import('@/app/(store)/blogs/[slug]/page');
        const metadata = await generateMetadata({
            params: Promise.resolve({ slug: 'test-blog' }),
        });

        expect(metadata.title).toBe('Test Blog | Sheza Star');
        expect(metadata.description).toBe('A short excerpt for the blog post.');
        expect(metadata.alternates?.canonical).toBe('/blogs/test-blog');
        expect(metadata.openGraph).toMatchObject({
            type: 'article',
            url: 'https://shezastar.com/blogs/test-blog',
            siteName: 'Sheza Star',
            publishedTime: '2026-01-15T00:00:00.000Z',
            modifiedTime: '2026-01-16T00:00:00.000Z',
            images: [
                {
                    url: 'https://shezastar.com/uploads/test-blog-cover.jpg',
                    secureUrl: 'https://shezastar.com/uploads/test-blog-cover.jpg',
                    alt: 'Test Blog | Sheza Star',
                },
            ],
        });
        expect(metadata.twitter?.images).toEqual(['https://shezastar.com/uploads/test-blog-cover.jpg']);
    });
});
