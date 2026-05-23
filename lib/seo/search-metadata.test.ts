import { describe, expect, it } from 'vitest';
import { generateMetadata } from '@/app/(store)/search/page';

describe('search page metadata', () => {
    it('uses noindex metadata and a stable canonical path', async () => {
        const metadata = await generateMetadata({
            searchParams: Promise.resolve({ q: 'dash cam' }),
        });

        expect(metadata.title).toBe('Search Results for "dash cam" | Sheza Star');
        expect(metadata.robots).toEqual({
            index: false,
            follow: true,
        });
        expect(metadata.alternates?.canonical).toBe('/search');
    });
});
