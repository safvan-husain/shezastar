import { describe, it, expect } from 'vitest';
import {
    createProductAction,
    deleteProductAction,
    updateProductAction,
} from '@/lib/actions/product.actions';
import { getProductById } from '@/lib/services/product.service';

function buildBaseForm() {
    const formData = new FormData();
    formData.append('name', 'Integration Product');
    formData.append('description', 'Integration test description');
    formData.append('basePrice', '120');
    formData.append('offerPrice', '100');
    formData.append(
        'existingImages',
        JSON.stringify([
            {
                id: 'existing-1',
                url: '/uploads/placeholder.jpg',
                mappedVariants: [],
                order: 0,
            },
        ]),
    );
    formData.append('variants', JSON.stringify([]));
    formData.append('subCategoryIds', JSON.stringify([]));

    return formData;
}

describe('Product Actions Integration', () => {
    it('creates a new product', async () => {
        const formData = buildBaseForm();

        const result = await createProductAction(formData);
        expect(result.success).toBe(true);
        if (!result.success) return;

        expect(result.data.name).toBe('Integration Product');
        expect(result.data.basePrice).toBe(120);
    });

    it('updates an existing product', async () => {
        const created = await createProductAction(buildBaseForm());
        if (!created.success) throw new Error('Failed to create product');

        const updateForm = new FormData();
        updateForm.append('name', 'Updated Integration Product');
        updateForm.append('basePrice', '150');
        updateForm.append('existingImages', JSON.stringify(created.data.images));

        const updated = await updateProductAction(created.data.id, updateForm);
        expect(updated.success).toBe(true);
        if (!updated.success) return;

        expect(updated.data.name).toBe('Updated Integration Product');
        expect(updated.data.basePrice).toBe(150);
    });

    it('deletes a product', async () => {
        const created = await createProductAction(buildBaseForm());
        if (!created.success) throw new Error('Failed to create product');

        const deleted = await deleteProductAction(created.data.id);
        expect(deleted.success).toBe(true);

        await expect(getProductById(created.data.id)).rejects.toThrow('PRODUCT_NOT_FOUND');
    });

    it('fails to delete missing product', async () => {
        const result = await deleteProductAction('000000000000000000000000');
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.code).toBe('PRODUCT_NOT_FOUND');
        }
    });
});
