import { describe, expect, it } from 'vitest';
import { parseCategoriesResponse } from '@/lib/category/category-client';

describe('parseCategoriesResponse', () => {
    it('normalizes missing nested arrays', () => {
        const parsed = parseCategoriesResponse([
            {
                id: 'cat-1',
                name: 'Electronics',
            },
            {
                id: 'cat-2',
                name: 'Clothing',
                subCategories: [
                    {
                        id: 'sub-1',
                        name: 'Shirts',
                    },
                ],
            },
        ]);

        expect(parsed).toEqual([
            {
                id: 'cat-1',
                name: 'Electronics',
                subCategories: [],
            },
            {
                id: 'cat-2',
                name: 'Clothing',
                subCategories: [
                    {
                        id: 'sub-1',
                        name: 'Shirts',
                        subSubCategories: [],
                    },
                ],
            },
        ]);
    });

    it('throws a clear error when the payload is not an array', () => {
        expect(() => parseCategoriesResponse({ categories: [] })).toThrow(
            'Categories API returned an invalid response (expected an array of categories)'
        );
    });
});
