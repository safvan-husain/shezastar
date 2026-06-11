import { describe, expect, it } from 'vitest';
import { ObjectId } from 'mongodb';
import { toCategory } from '@/lib/category/model/category.model';

describe('category.model', () => {
    it('normalizes categories missing subCategories', () => {
        const doc = {
            _id: new ObjectId(),
            name: 'Electronics',
            slug: 'electronics',
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        };

        const category = toCategory(doc as any);

        expect(category.subCategories).toEqual([]);
    });

    it('normalizes subcategories missing subSubCategories', () => {
        const doc = {
            _id: new ObjectId(),
            name: 'Electronics',
            slug: 'electronics',
            subCategories: [
                {
                    id: 'sub-1',
                    name: 'Phones',
                    slug: 'electronics-phones',
                },
            ],
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
        };

        const category = toCategory(doc as any);

        expect(category.subCategories).toHaveLength(1);
        expect(category.subCategories[0].subSubCategories).toEqual([]);
    });
});
