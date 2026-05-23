import { describe, expect, it } from 'vitest';
import { buildNoIndexMetadata, buildSocialMetadata } from '@/lib/seo/metadata';

describe('SEO metadata helpers', () => {
    it('builds social metadata with canonical, OG, and Twitter fields', () => {
        const metadata = buildSocialMetadata({
            title: 'About | Sheza Star',
            description: 'Learn about Sheza Star.',
            canonicalPath: '/aboutus',
            imageUrl: '/uploads/about.jpg',
            type: 'website',
        });

        expect(metadata.alternates?.canonical).toBe('/aboutus');
        expect(metadata.openGraph).toMatchObject({
            title: 'About | Sheza Star',
            description: 'Learn about Sheza Star.',
            type: 'website',
            url: 'https://shezastar.com/aboutus',
            siteName: 'Sheza Star',
            images: [
                {
                    url: 'https://shezastar.com/uploads/about.jpg',
                    secureUrl: 'https://shezastar.com/uploads/about.jpg',
                    alt: 'About | Sheza Star',
                },
            ],
        });
        expect(metadata.twitter).toMatchObject({
            card: 'summary_large_image',
            title: 'About | Sheza Star',
            description: 'Learn about Sheza Star.',
            images: ['https://shezastar.com/uploads/about.jpg'],
        });
    });

    it('omits image tags when no image is provided', () => {
        const metadata = buildSocialMetadata({
            title: 'Blog | Sheza Star',
            description: 'Blog excerpt',
            canonicalPath: '/blogs/example',
            type: 'article',
            publishedTime: '2026-01-01T00:00:00.000Z',
        });

        expect(metadata.openGraph?.images).toBeUndefined();
        expect(metadata.twitter?.card).toBe('summary');
        expect(metadata.openGraph?.publishedTime).toBe('2026-01-01T00:00:00.000Z');
    });

    it('builds noindex metadata for private pages', () => {
        const metadata = buildNoIndexMetadata({
            title: 'Cart | Sheza Star',
            follow: true,
        });

        expect(metadata.title).toBe('Cart | Sheza Star');
        expect(metadata.robots).toEqual({
            index: false,
            follow: true,
        });
    });
});
