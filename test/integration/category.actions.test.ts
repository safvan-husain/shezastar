import { describe, it, expect } from 'vitest';
import {
    addSubCategoryAction,
    createCategoryAction,
    deleteCategoryAction,
    removeSubCategoryAction,
    updateCategoryAction,
} from '@/lib/actions/category.actions';
import { getCategory } from '@/lib/services/category.service';

describe('Category Actions Integration', () => {
    it('creates a new category', async () => {
        const formData = new FormData();
        formData.append('name', 'Accessories');
        formData.append(
            'subCategories',
            JSON.stringify([{ name: 'Cables' }, { name: 'Cases' }]),
        );

        const result = await createCategoryAction(formData);
        expect(result.success).toBe(true);
        if (!result.success) return;

        expect(result.data.name).toBe('Accessories');
        expect(result.data.subCategories).toHaveLength(2);
    });

    it('updates a category', async () => {
        const createForm = new FormData();
        createForm.append('name', 'Apparel');
        const created = await createCategoryAction(createForm);
        if (!created.success) throw new Error('Failed to create category');

        const updateForm = new FormData();
        updateForm.append('name', 'Apparel & Wear');
        updateForm.append(
            'subCategories',
            JSON.stringify(created.data.subCategories),
        );

        const updated = await updateCategoryAction(created.data.id, updateForm);
        expect(updated.success).toBe(true);
        if (!updated.success) return;

        expect(updated.data.name).toBe('Apparel & Wear');
    });

    it('adds and removes subcategories', async () => {
        const createForm = new FormData();
        createForm.append('name', 'Garden');
        const created = await createCategoryAction(createForm);
        if (!created.success) throw new Error('Failed to create category');

        const addForm = new FormData();
        addForm.append('name', 'Plants');
        const added = await addSubCategoryAction(created.data.id, addForm);
        expect(added.success).toBe(true);
        if (!added.success) return;

        const target = added.data.subCategories.find((sub: any) => sub.name === 'Plants');
        expect(target).toBeDefined();

        const removed = await removeSubCategoryAction(created.data.id, target.id);
        expect(removed.success).toBe(true);
        if (!removed.success) return;
        expect(removed.data.subCategories.some((sub: any) => sub.id === target.id)).toBe(false);
    });

    it('deletes a category', async () => {
        const createForm = new FormData();
        createForm.append('name', 'Temporary');
        const created = await createCategoryAction(createForm);
        if (!created.success) throw new Error('Failed to create category');

        const deleted = await deleteCategoryAction(created.data.id);
        expect(deleted.success).toBe(true);

        await expect(getCategory(created.data.id)).rejects.toThrow('CATEGORY_NOT_FOUND');
    });
});
