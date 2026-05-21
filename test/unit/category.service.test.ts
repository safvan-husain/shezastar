import { beforeEach, describe, expect, it } from 'vitest';
import {
    createCategory,
    addSubCategory,
    addSubSubCategory,
    updateSubCategory,
    removeSubSubCategory,
    removeSubCategory,
    getCategory,
    getCategoryHierarchyIds,
    getBroaderCategoryContextIds,
    deleteCategory,
} from '@/lib/category/category.service';
import { createProduct, getProduct } from '@/lib/product/product.service';
import { AppError } from '@/lib/errors/app-error';
import { clear } from '../test-db';

describe('Category Service - Three Level Hierarchy', () => {
    let categoryId: string;
    let subCategoryId: string;
    let subSubCategoryId: string;

    beforeEach(async () => {
        await clear();
    });

    it('should support creating and managing sub-subcategories', async () => {
        const category = await createCategory({ name: 'Electronics', subCategories: [] });
        categoryId = category.id;

        const withSubCategory = await addSubCategory(categoryId, { name: 'Phones' });
        expect(withSubCategory.subCategories[0].subSubCategories).toEqual([]);
        subCategoryId = withSubCategory.subCategories[0].id;

        const withSubSubCategory = await addSubSubCategory(categoryId, subCategoryId, { name: 'iPhone' });
        const subCategory = withSubSubCategory.subCategories.find(sub => sub.id === subCategoryId);
        expect(subCategory?.subSubCategories[0].name).toBe('iPhone');
        subSubCategoryId = subCategory?.subSubCategories[0].id as string;

        const updated = await updateSubCategory(categoryId, subCategoryId, {
            name: 'Smartphones',
            subSubCategories: [{ id: subSubCategoryId, name: 'iOS' }],
        });
        const updatedSubCategory = updated.subCategories.find(sub => sub.id === subCategoryId);
        expect(updatedSubCategory?.name).toBe('Smartphones');
        expect(updatedSubCategory?.subSubCategories[0].name).toBe('iOS');

        const afterRemoval = await removeSubSubCategory(categoryId, subCategoryId, subSubCategoryId);
        const remainingSubCategory = afterRemoval.subCategories.find(sub => sub.id === subCategoryId);
        expect(remainingSubCategory?.subSubCategories.length).toBe(0);

        const finalCategory = await removeSubCategory(categoryId, subCategoryId);
        expect(finalCategory.subCategories.length).toBe(0);

        const persisted = await getCategory(categoryId);
        expect(persisted.subCategories.length).toBe(0);
    });

    it('should prevent duplicate sub-subcategory names in the same subcategory', async () => {
        const category = await createCategory({ name: 'Clothing', subCategories: [] });
        categoryId = category.id;
        const withSubCategory = await addSubCategory(categoryId, { name: 'Shirts' });
        subCategoryId = withSubCategory.subCategories[0].id;

        await addSubSubCategory(categoryId, subCategoryId, { name: 'Formal' });
        await expect(
            addSubSubCategory(categoryId, subCategoryId, { name: 'Formal' })
        ).rejects.toThrow(AppError);
    });

    it('should fetch a category by slug as well as id', async () => {
        const category = await createCategory({ name: 'Gaming', subCategories: [] });
        const fetched = await getCategory(category.slug);
        expect(fetched.id).toBe(category.id);
    });
});

describe('getCategoryHierarchyIds', () => {
    let categoryId: string;
    let categorySlug: string;
    let subCategoryId: string;
    let subCategorySlug: string;
    let subSubCategoryId: string;
    let subSubCategorySlug: string;
    let siblingSubSubCategoryId: string;

    beforeEach(async () => {
        await clear();
        const category = await createCategory({
            name: 'Hierarchy Root',
            subCategories: [
                {
                    id: 'child-1',
                    name: 'Child One',
                    subSubCategories: [
                        { id: 'leaf-1', name: 'Leaf One' },
                        { id: 'leaf-2', name: 'Leaf Two' },
                    ],
                },
            ],
        });

        categoryId = category.id;
        categorySlug = category.slug;
        subCategoryId = category.subCategories[0].id;
        subCategorySlug = category.subCategories[0].slug;
        subSubCategoryId = category.subCategories[0].subSubCategories[0].id;
        subSubCategorySlug = category.subCategories[0].subSubCategories[0].slug;
        siblingSubSubCategoryId = category.subCategories[0].subSubCategories[1].id;
    });

    it('returns full hierarchy ids when given a category id', async () => {
        const ids = await getCategoryHierarchyIds(categoryId);
        expect(ids).toEqual(
            expect.arrayContaining([categoryId, subCategoryId, subSubCategoryId, siblingSubSubCategoryId])
        );
        expect(ids.length).toBe(4);
    });

    it('returns full hierarchy ids when given a category slug', async () => {
        const ids = await getCategoryHierarchyIds(categorySlug);
        expect(ids).toEqual(
            expect.arrayContaining([categoryId, subCategoryId, subSubCategoryId, siblingSubSubCategoryId])
        );
        expect(ids.length).toBe(4);
    });

    it('returns subcategory and descendants when given a subcategory slug', async () => {
        const ids = await getCategoryHierarchyIds(subCategorySlug);
        expect(ids).toEqual(
            expect.arrayContaining([subCategoryId, subSubCategoryId, siblingSubSubCategoryId])
        );
        expect(ids).not.toContain(categoryId);
        expect(ids.length).toBe(3);
    });

    it('returns only the sub-subcategory id when given a sub-subcategory slug', async () => {
        const ids = await getCategoryHierarchyIds(subSubCategorySlug);
        expect(ids).toEqual([subSubCategoryId]);
    });

    it('throws when the category identifier does not exist', async () => {
        await expect(getCategoryHierarchyIds('missing-category')).rejects.toThrow(AppError);
    });

    it('returns broader context ids (ancestors + self)', async () => {
        const ids = await getBroaderCategoryContextIds([subSubCategoryId]);
        expect(ids).toEqual(expect.arrayContaining([subSubCategoryId, subCategoryId, categoryId]));
        expect(ids.length).toBe(3);
    });
});

describe('Category Service - Deletion Cleanup', () => {
    beforeEach(async () => {
        await clear();
    });

    it('deletes an unused category normally', async () => {
        const category = await createCategory({ name: 'Unused Delete Root', subCategories: [] });

        const result = await deleteCategory(category.id);

        expect(result).toMatchObject({
            success: true,
            cleanedProductCount: 0,
            removedCategoryIds: [category.id],
        });
        await expect(getCategory(category.id)).rejects.toThrow(AppError);
    });

    it('blocks deleting a referenced category without force', async () => {
        const category = await createCategory({ name: 'Referenced Delete Root', subCategories: [] });
        await createProduct({
            name: 'Referenced Root Product',
            basePrice: 10,
            images: [],
            variants: [],
            variantStock: [],
            specifications: [],
            subCategoryIds: [category.id],
        });

        await expect(deleteCategory(category.id)).rejects.toMatchObject({
            status: 409,
            code: 'CATEGORY_IN_USE',
        });
    });

    it('force deletes a referenced category and cleans product references', async () => {
        const category = await createCategory({ name: 'Forced Delete Root', subCategories: [] });
        const product = await createProduct({
            name: 'Forced Root Product',
            basePrice: 10,
            images: [],
            variants: [],
            variantStock: [],
            specifications: [],
            subCategoryIds: [category.id],
        });

        const result = await deleteCategory(category.id, { force: true });
        const cleanedProduct = await getProduct(product.id);

        expect(result.cleanedProductCount).toBe(1);
        expect(result.cleanedProductIds).toEqual([product.id]);
        expect(result.removedCategoryIds).toEqual([category.id]);
        expect(cleanedProduct.subCategoryIds).toEqual([]);
    });

    it('force deleting a parent category cleans descendant references from products', async () => {
        const category = await createCategory({
            name: 'Forced Delete Parent',
            subCategories: [
                {
                    id: 'delete-child',
                    name: 'Delete Child',
                    subSubCategories: [{ id: 'delete-leaf', name: 'Delete Leaf' }],
                },
            ],
        });
        const childProduct = await createProduct({
            name: 'Child Reference Product',
            basePrice: 10,
            images: [],
            variants: [],
            variantStock: [],
            specifications: [],
            subCategoryIds: ['delete-child'],
        });
        const leafProduct = await createProduct({
            name: 'Leaf Reference Product',
            basePrice: 10,
            images: [],
            variants: [],
            variantStock: [],
            specifications: [],
            subCategoryIds: ['delete-leaf'],
        });

        const result = await deleteCategory(category.id, { force: true });

        expect(result.cleanedProductCount).toBe(2);
        expect(result.removedCategoryIds).toEqual(expect.arrayContaining([category.id, 'delete-child', 'delete-leaf']));
        await expect(getProduct(childProduct.id)).resolves.toMatchObject({ subCategoryIds: [] });
        await expect(getProduct(leafProduct.id)).resolves.toMatchObject({ subCategoryIds: [] });
    });

    it('force deleting a subcategory cleans the subcategory and level 3 references', async () => {
        const category = await createCategory({
            name: 'Forced Delete Subcategory Parent',
            subCategories: [
                {
                    id: 'remove-sub',
                    name: 'Remove Sub',
                    subSubCategories: [{ id: 'remove-leaf', name: 'Remove Leaf' }],
                },
            ],
        });
        const product = await createProduct({
            name: 'Subcategory Cleanup Product',
            basePrice: 10,
            images: [],
            variants: [],
            variantStock: [],
            specifications: [],
            subCategoryIds: ['remove-sub', 'remove-leaf'],
        });

        const updatedCategory = await removeSubCategory(category.id, 'remove-sub', { force: true });
        const cleanedProduct = await getProduct(product.id);

        expect(updatedCategory.subCategories).toEqual([]);
        expect((updatedCategory as any).cleanedProductCount).toBe(1);
        expect(cleanedProduct.subCategoryIds).toEqual([]);
    });
});
