import { describe, it, expect } from 'vitest';
import {
    addVariantItemAction,
    createVariantTypeAction,
    deleteVariantTypeAction,
    removeVariantItemAction,
    updateVariantTypeAction,
} from '@/lib/actions/variant-type.actions';
import { getPrismaClient } from '../test-db';

describe('Variant Types Server Actions', () => {
    it('should create a new variant type', async () => {
        const formData = new FormData();
        formData.append('name', 'Color');
        formData.append(
            'items',
            JSON.stringify([
                { id: 'red', name: 'Red' },
                { id: 'blue', name: 'Blue' },
            ]),
        );

        const result = await createVariantTypeAction(formData);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.name).toBe('Color');
            expect(result.data.items).toHaveLength(2);
        }
    });

    it('should get all variant types', async () => {
        const createForm = new FormData();
        createForm.append('name', 'Size');
        createForm.append('items', JSON.stringify([{ id: 'small', name: 'Small' }]));
        await createVariantTypeAction(createForm);

        const prisma = await getPrismaClient();
        const variantTypes = await prisma.variantType.findMany();

        expect(Array.isArray(variantTypes)).toBe(true);
        expect(variantTypes.length).toBeGreaterThan(0);
    });

    it('should get a single variant type by id', async () => {
        const createForm = new FormData();
        createForm.append('name', 'Material');
        createForm.append('items', JSON.stringify([{ id: 'cotton', name: 'Cotton' }]));
        const created = await createVariantTypeAction(createForm);
        if (!created.success) throw new Error('Failed to create variant type for test');

        const prisma = await getPrismaClient();
        const variantType = await prisma.variantType.findUnique({ where: { id: created.data.id } });

        expect(variantType).toBeTruthy();
        expect(variantType?.id).toBe(created.data.id);
        expect(variantType?.name).toBe('Material');
    });

    it('should update a variant type', async () => {
        const createForm = new FormData();
        createForm.append('name', 'Memory');
        createForm.append('items', JSON.stringify([{ id: '8gb', name: '8GB' }]));
        const created = await createVariantTypeAction(createForm);
        if (!created.success) throw new Error('Failed to create variant type for test');

        const formData = new FormData();
        formData.append('name', 'Updated Color');
        formData.append(
            'items',
            JSON.stringify([{ id: 'green', name: 'Green' }]),
        );

        const result = await updateVariantTypeAction(created.data.id, formData);

        expect(result.success).toBe(true);
        if (!result.success) return;

        expect(result.data.name).toBe('Updated Color');
        expect(result.data.items).toHaveLength(1);
        expect(result.data.items[0].name).toBe('Green');
    });

    it('should delete a variant type', async () => {
        const createForm = new FormData();
        createForm.append('name', 'Delete Target');
        createForm.append('items', JSON.stringify([{ id: 'one', name: 'One' }]));
        const created = await createVariantTypeAction(createForm);
        if (!created.success) throw new Error('Failed to create variant type for test');

        const result = await deleteVariantTypeAction(created.data.id);

        expect(result.success).toBe(true);

        const prisma = await getPrismaClient();
        const variantType = await prisma.variantType.findUnique({ where: { id: created.data.id } });
        expect(variantType).toBeNull();
    });

    it('should return error when deleting non-existent variant type', async () => {
        const result = await deleteVariantTypeAction('000000000000000000000000');
        expect(result.success).toBe(false);
        if (result.success) return;
        expect(result.error.code).toBe('VARIANT_TYPE_NOT_FOUND');
    });

    it('should add a variant item', async () => {
        const formData = new FormData();
        formData.append('name', 'Collections');
        formData.append('items', JSON.stringify([{ id: 'basic', name: 'Basic' }]));

        const created = await createVariantTypeAction(formData);
        if (!created.success) throw new Error('Failed to create variant type for test');

        const addForm = new FormData();
        addForm.append('name', 'Advanced');
        const added = await addVariantItemAction(created.data.id, addForm);
        expect(added.success).toBe(true);
        if (!added.success) return;

        expect(added.data.items.some((item: any) => item.name === 'Advanced')).toBe(true);
    });

    it('should remove a variant item', async () => {
        const formData = new FormData();
        formData.append('name', 'Fabrics');
        formData.append(
            'items',
            JSON.stringify([
                { id: 'linen', name: 'Linen' },
                { id: 'silk', name: 'Silk' },
            ]),
        );

        const created = await createVariantTypeAction(formData);
        if (!created.success) throw new Error('Failed to create variant type for test');

        const silk = created.data.items.find((item: any) => item.name === 'Silk');
        if (!silk) throw new Error('Expected Silk variant item');
        const removed = await removeVariantItemAction(created.data.id, silk.id);
        expect(removed.success).toBe(true);
        if (!removed.success) return;

        expect(removed.data.items.some((item: any) => item.id === silk.id)).toBe(false);
    });

    it('should error when removing a missing variant item', async () => {
        const formData = new FormData();
        formData.append('name', 'Memory');
        formData.append('items', JSON.stringify([{ id: '4gb', name: '4GB' }]));

        const created = await createVariantTypeAction(formData);
        if (!created.success) throw new Error('Failed to create variant type for test');

        const removed = await removeVariantItemAction(created.data.id, '000000000000000000000000');
        expect(removed.success).toBe(false);
        if (!removed.success) {
            expect(removed.error.code).toBe('VARIANT_ITEM_NOT_FOUND');
        }
    });
});
