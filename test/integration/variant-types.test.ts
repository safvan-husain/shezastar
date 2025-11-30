import { describe, it, expect } from 'vitest';
import {
    createVariantTypeAction,
    deleteVariantTypeAction,
    updateVariantTypeAction,
} from '@/lib/actions/variant-type.actions';
import { getPrismaClient } from '../test-db';

describe('Variant Types Server Actions', () => {
    let createdVariantTypeId: string;

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
        if (!result.success) return;

        createdVariantTypeId = result.data.id;
        expect(result.data.name).toBe('Color');
        expect(result.data.items).toHaveLength(2);
    });

    it('should get all variant types', async () => {
        const prisma = await getPrismaClient();
        const variantTypes = await prisma.variantType.findMany();

        expect(Array.isArray(variantTypes)).toBe(true);
        expect(variantTypes.length).toBeGreaterThan(0);
        const found = variantTypes.find(vt => vt.id === createdVariantTypeId);
        expect(found).toBeDefined();
    });

    it('should get a single variant type by id', async () => {
        const prisma = await getPrismaClient();
        const variantType = await prisma.variantType.findUnique({ where: { id: createdVariantTypeId } });

        expect(variantType).toBeTruthy();
        expect(variantType?.id).toBe(createdVariantTypeId);
        expect(variantType?.name).toBe('Color');
    });

    it('should update a variant type', async () => {
        const formData = new FormData();
        formData.append('name', 'Updated Color');
        formData.append(
            'items',
            JSON.stringify([{ id: 'green', name: 'Green' }]),
        );

        const result = await updateVariantTypeAction(createdVariantTypeId, formData);

        expect(result.success).toBe(true);
        if (!result.success) return;

        expect(result.data.name).toBe('Updated Color');
        expect(result.data.items).toHaveLength(1);
        expect(result.data.items[0].name).toBe('Green');
    });

    it('should delete a variant type', async () => {
        const result = await deleteVariantTypeAction(createdVariantTypeId);

        expect(result.success).toBe(true);

        const prisma = await getPrismaClient();
        const variantType = await prisma.variantType.findUnique({ where: { id: createdVariantTypeId } });
        expect(variantType).toBeNull();
    });

    it('should return error when deleting non-existent variant type', async () => {
        const result = await deleteVariantTypeAction('000000000000000000000000');
        expect(result.success).toBe(false);
        if (result.success) return;
        expect(result.error.code).toBe('VARIANT_TYPE_NOT_FOUND');
    });
});
