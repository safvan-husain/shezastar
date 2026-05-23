import type { MetadataRoute } from 'next';
import { buildCanonicalUrl } from '@/lib/seo/canonical';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: ['/', '/aboutus', '/contact-us', '/privacy-policy', '/terms-and-conditions', '/return-refund-policy', '/products', '/blogs', '/category', '/product/'],
                disallow: ['/cart', '/checkout', '/account', '/orders', '/wishlist', '/search', '/manage', '/api', '/auth', '/admin', '/login', '/register'],
            },
        ],
        sitemap: buildCanonicalUrl('/sitemap.xml'),
    };
}
