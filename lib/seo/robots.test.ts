import { describe, expect, it } from 'vitest';
import robots from '@/app/robots';

describe('robots rules', () => {
    it('allows indexable storefront pages and blocks private routes', () => {
        const config = robots();
        const rule = Array.isArray(config.rules) ? config.rules[0] : config.rules;
        const allowRules = Array.isArray(rule.allow) ? rule.allow : [rule.allow];
        const disallowRules = Array.isArray(rule.disallow) ? rule.disallow : [rule.disallow];

        expect(rule.userAgent).toBe('*');
        expect(allowRules).toEqual(expect.arrayContaining(['/products', '/blogs', '/category', '/product/']));
        expect(disallowRules).toEqual(
            expect.arrayContaining(['/cart', '/checkout', '/account', '/orders', '/wishlist', '/search', '/manage', '/api', '/auth', '/admin'])
        );
        expect(config.sitemap).toBe('https://shezastar.com/sitemap.xml');
    });
});
