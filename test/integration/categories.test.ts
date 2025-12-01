import { beforeAll, describe, expect, it } from 'vitest';
import { POST as createCategory } from '@/app/api/categories/route';
import { GET as getCategory, DELETE as deleteCategory } from '@/app/api/categories/[id]/route';
import { POST as addSubCategory } from '@/app/api/categories/[id]/subcategories/route';
import { PUT as updateSubCategory, DELETE as removeSubCategory } from '@/app/api/categories/[id]/subcategories/[subId]/route';
import { POST as addSubSubCategory } from '@/app/api/categories/[id]/subcategories/[subId]/subsubcategories/route';
import {
    DELETE as removeSubSubCategory,
} from '@/app/api/categories/[id]/subcategories/[subId]/subsubcategories/[subSubId]/route';
import { clear } from '../test-db';

describe('Category API Integration - Three Level Categories', () => {
    let categoryId: string;
    let subCategoryId: string;
    let subSubCategoryId: string;

    beforeAll(async () => {
        await clear();
    });

    it('should create a category and manage nested subcategories', async () => {
        const createReq = new Request('http://localhost/api/categories', {
            method: 'POST',
            body: JSON.stringify({ name: 'Integration Electronics' }),
        });

        const createRes = await createCategory(createReq);
        const createdBody = await createRes.json();
        expect(createRes.status).toBe(201);
        categoryId = createdBody.id;

        const addSubReq = new Request(`http://localhost/api/categories/${categoryId}/subcategories`, {
            method: 'POST',
            body: JSON.stringify({ name: 'Phones' }),
        });
        const subParams = Promise.resolve({ id: categoryId });
        const addSubRes = await addSubCategory(addSubReq, { params: subParams });
        const subBody = await addSubRes.json();
        expect(addSubRes.status).toBe(200);
        subCategoryId = subBody.subCategories[0].id;

        const addSubSubReq = new Request(
            `http://localhost/api/categories/${categoryId}/subcategories/${subCategoryId}/subsubcategories`,
            {
                method: 'POST',
                body: JSON.stringify({ name: 'iPhone' }),
            }
        );
        const subSubParams = Promise.resolve({ id: categoryId, subId: subCategoryId });
        const addSubSubRes = await addSubSubCategory(addSubSubReq, { params: subSubParams });
        const subSubBody = await addSubSubRes.json();
        expect(addSubSubRes.status).toBe(200);
        const subCategory = subSubBody.subCategories.find((sub: any) => sub.id === subCategoryId);
        subSubCategoryId = subCategory.subSubCategories[0].id;

        const updateSubReq = new Request(
            `http://localhost/api/categories/${categoryId}/subcategories/${subCategoryId}`,
            {
                method: 'PUT',
                body: JSON.stringify({
                    name: 'Smartphones',
                    subSubCategories: [{ id: subSubCategoryId, name: 'iOS' }],
                }),
            }
        );
        const updateSubParams = Promise.resolve({ id: categoryId, subId: subCategoryId });
        const updateSubRes = await updateSubCategory(updateSubReq, { params: updateSubParams });
        const updateBody = await updateSubRes.json();
        expect(updateSubRes.status).toBe(200);
        const updatedSub = updateBody.subCategories.find((sub: any) => sub.id === subCategoryId);
        expect(updatedSub.name).toBe('Smartphones');
        expect(updatedSub.subSubCategories[0].name).toBe('iOS');

        const removeSubSubReq = new Request(
            `http://localhost/api/categories/${categoryId}/subcategories/${subCategoryId}/subsubcategories/${subSubCategoryId}`,
            { method: 'DELETE' }
        );
        const removeSubSubParams = Promise.resolve({
            id: categoryId,
            subId: subCategoryId,
            subSubId: subSubCategoryId,
        });
        const removeSubSubRes = await removeSubSubCategory(removeSubSubReq, { params: removeSubSubParams });
        const removeSubSubBody = await removeSubSubRes.json();
        expect(removeSubSubRes.status).toBe(200);
        const remainingSub = removeSubSubBody.subCategories.find((sub: any) => sub.id === subCategoryId);
        expect(remainingSub.subSubCategories.length).toBe(0);

        const removeSubReq = new Request(
            `http://localhost/api/categories/${categoryId}/subcategories/${subCategoryId}`,
            { method: 'DELETE' }
        );
        const removeSubParams = Promise.resolve({ id: categoryId, subId: subCategoryId });
        const removeSubRes = await removeSubCategory(removeSubReq, { params: removeSubParams });
        const removeSubBody = await removeSubRes.json();
        expect(removeSubRes.status).toBe(200);
        expect(removeSubBody.subCategories.length).toBe(0);

        const getReq = new Request(`http://localhost/api/categories/${categoryId}`);
        const getParams = Promise.resolve({ id: categoryId });
        const getRes = await getCategory(getReq, { params: getParams });
        const getBody = await getRes.json();
        expect(getRes.status).toBe(200);
        expect(getBody.subCategories.length).toBe(0);

        const slugGetReq = new Request(`http://localhost/api/categories/${createdBody.slug}`);
        const slugGetParams = Promise.resolve({ id: createdBody.slug });
        const slugGetRes = await getCategory(slugGetReq, { params: slugGetParams });
        const slugGetBody = await slugGetRes.json();
        expect(slugGetRes.status).toBe(200);
        expect(slugGetBody.id).toBe(categoryId);

        const deleteReq = new Request(`http://localhost/api/categories/${categoryId}`, {
            method: 'DELETE',
        });
        const deleteParams = Promise.resolve({ id: categoryId });
        const deleteRes = await deleteCategory(deleteReq, { params: deleteParams });
        const deleteBody = await deleteRes.json();
        expect(deleteRes.status).toBe(200);
        expect(deleteBody.success).toBe(true);
    });
});
