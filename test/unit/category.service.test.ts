import { describe, it, expect } from 'vitest';
import {
    addSubCategory,
    createCategory,
    deleteCategory,
    getAllCategories,
    getCategory,
    removeSubCategory,
    updateCategory,
} from '@/lib/services/category.service';
import { AppError } from '@/lib/errors/app-error';

describe('Category Service Unit Tests', () => {
    it('creates a category with subcategories', async () => {
        const result = await createCategory({
            name: 'Electronics',
            subCategories: [{ name: 'Audio' }],
        });

        expect(result.name).toBe('Electronics');
        expect(result.subCategories).toHaveLength(1);
        expect(result.subCategories[0].id).toBeDefined();
    });

    it('rejects duplicate category names', async () => {
        await createCategory({ name: 'Vehicles', subCategories: [] });
        await expect(
            createCategory({ name: 'Vehicles', subCategories: [] }),
        ).rejects.toThrow(AppError);
    });

    it('retrieves category by id', async () => {
        const created = await createCategory({ name: 'Home', subCategories: [] });
        const fetched = await getCategory(created.id);
        expect(fetched.name).toBe('Home');
    });

    it('lists categories ordered alphabetically', async () => {
        await createCategory({ name: 'Zeta', subCategories: [] });
        await createCategory({ name: 'Alpha', subCategories: [] });

        const categories = await getAllCategories();
        expect(categories[0].name).toBe('Alpha');
        expect(categories[1].name).toBe('Zeta');
    });

    it('updates category and prevents duplicate names', async () => {
        const target = await createCategory({ name: 'First', subCategories: [] });
        const other = await createCategory({ name: 'Second', subCategories: [] });

        const updated = await updateCategory(target.id, { name: 'First Updated' });
        expect(updated.name).toBe('First Updated');

        await expect(updateCategory(other.id, { name: 'First Updated' })).rejects.toThrow(AppError);
    });

    it('deletes a category', async () => {
        const created = await createCategory({ name: 'Temp', subCategories: [] });
        const result = await deleteCategory(created.id);
        expect(result.success).toBe(true);
        await expect(getCategory(created.id)).rejects.toThrow('CATEGORY_NOT_FOUND');
    });

    it('adds and rejects duplicate subcategories', async () => {
        const category = await createCategory({ name: 'Garden', subCategories: [] });
        const updated = await addSubCategory(category.id, { name: 'Plants' });
        expect(updated.subCategories).toHaveLength(1);

        await expect(addSubCategory(category.id, { name: 'Plants' })).rejects.toThrow(AppError);
    });

    it('removes a subcategory and rejects missing entries', async () => {
        const initial = await createCategory({
            name: 'Office',
            subCategories: [{ name: 'Supplies' }],
        });
        const [subCategory] = initial.subCategories;

        const removed = await removeSubCategory(initial.id, subCategory.id);
        expect(removed.subCategories).toHaveLength(0);

        await expect(removeSubCategory(initial.id, '000000000000000000000000')).rejects.toThrow(AppError);
    });
});
