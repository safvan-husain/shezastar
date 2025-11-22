import { describe, it, expect } from 'vitest';
import { GET as getVariantTypes, POST as createVariantType } from '@/app/api/variant-types/route';
import { GET as getVariantType, PUT as updateVariantType, DELETE as deleteVariantType } from '@/app/api/variant-types/[id]/route';

describe('Variant Types API Integration', () => {
    let createdVariantTypeId: string;

    it('should create a new variant type', async () => {
        const variantTypeData = {
            name: 'Color',
            items: [
                { id: 'red', name: 'Red' },
                { id: 'blue', name: 'Blue' }
            ]
        };

        const req = new Request('http://localhost/api/variant-types', {
            method: 'POST',
            body: JSON.stringify(variantTypeData),
        });

        const res = await createVariantType(req);
        const body = await res.json();

        expect(res.status).toBe(201);
        expect(body).toMatchObject({
            name: variantTypeData.name,
        });
        expect(body.items).toHaveLength(2);
        expect(body.id).toBeDefined();
        createdVariantTypeId = body.id;
    });

    it('should get all variant types', async () => {
        // The GET handler for variant types doesn't use the request object
        const res = await getVariantTypes();
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeGreaterThan(0);
        const found = body.find((vt: any) => vt.id === createdVariantTypeId);
        expect(found).toBeDefined();
    });

    it('should get a single variant type by id', async () => {
        const req = new Request(`http://localhost/api/variant-types/${createdVariantTypeId}`);
        const params = Promise.resolve({ id: createdVariantTypeId });
        const res = await getVariantType(req, { params });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.id).toBe(createdVariantTypeId);
        expect(body.name).toBe('Color');
    });

    it('should update a variant type', async () => {
        const updateData = {
            name: 'Updated Color',
            items: [
                { id: 'green', name: 'Green' }
            ]
        };

        const req = new Request(`http://localhost/api/variant-types/${createdVariantTypeId}`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
        });
        const params = Promise.resolve({ id: createdVariantTypeId });
        const res = await updateVariantType(req, { params });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.name).toBe(updateData.name);
        expect(body.items).toHaveLength(1);
        expect(body.items[0].name).toBe('Green');
    });

    it('should delete a variant type', async () => {
        const req = new Request(`http://localhost/api/variant-types/${createdVariantTypeId}`, {
            method: 'DELETE',
        });
        const params = Promise.resolve({ id: createdVariantTypeId });
        const res = await deleteVariantType(req, { params });
        const body = await res.json();

        expect(res.status).toBe(200);
        expect(body.success).toBe(true);
    });

    it('should return 404 for deleted variant type', async () => {
        const req = new Request(`http://localhost/api/variant-types/${createdVariantTypeId}`);
        const params = Promise.resolve({ id: createdVariantTypeId });
        const res = await getVariantType(req, { params });

        expect(res.status).toBe(404);
    });
});
