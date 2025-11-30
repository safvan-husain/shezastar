import { describe, it, expect } from 'vitest';
import {
    addItemToVariantType,
    createVariantType,
    deleteVariantType,
    getVariantType,
    removeItemFromVariantType,
    updateVariantType,
} from '@/lib/services/variant-type.service';
import { AppError } from '@/lib/errors/app-error';

describe('Variant Type Service Unit Tests', () => {
    it('creates a variant type', async () => {
        const result = await createVariantType({
            name: 'Color',
            items: [{ name: 'Red' }],
        });

        expect(result.name).toBe('Color');
        expect(result.items).toHaveLength(1);
        expect(result.items[0].id).toBeDefined();
    });

    it('rejects duplicate variant type names', async () => {
        await createVariantType({ name: 'Storage', items: [{ name: '64GB' }] });
        await expect(
            createVariantType({ name: 'Storage', items: [{ name: '128GB' }] }),
        ).rejects.toThrow(AppError);
    });

    it('retrieves variant type by id', async () => {
        const created = await createVariantType({ name: 'Material', items: [{ name: 'Cotton' }] });
        const fetched = await getVariantType(created.id);
        expect(fetched.name).toBe('Material');
    });

    it('updates variant type and prevents duplicate names', async () => {
        const source = await createVariantType({ name: 'First', items: [{ name: 'One' }] });
        const other = await createVariantType({ name: 'Second', items: [{ name: 'Two' }] });

        const updated = await updateVariantType(source.id, {
            name: 'First Updated',
            items: [{ name: 'Updated' }],
        });
        expect(updated.name).toBe('First Updated');
        expect(updated.items).toHaveLength(1);

        await expect(updateVariantType(other.id, { name: 'First Updated' })).rejects.toThrow(AppError);
    });

    it('deletes variant type', async () => {
        const created = await createVariantType({ name: 'Temporary', items: [{ name: 'Item' }] });
        const result = await deleteVariantType(created.id);
        expect(result.success).toBe(true);
        await expect(getVariantType(created.id)).rejects.toThrow('VARIANT_TYPE_NOT_FOUND');
    });

    it('adds and removes variant items', async () => {
        const created = await createVariantType({ name: 'Components', items: [{ name: 'Core' }] });
        const withNewItem = await addItemToVariantType(created.id, { name: 'Addon' });
        expect(withNewItem.items).toHaveLength(2);

        const addedItem = withNewItem.items.find(item => item.name === 'Addon');
        expect(addedItem).toBeDefined();

        const afterRemove = await removeItemFromVariantType(created.id, addedItem!.id);
        expect(afterRemove.items.some(item => item.id === addedItem!.id)).toBe(false);
    });

    it('rejects removing missing items', async () => {
        const created = await createVariantType({ name: 'Sizes', items: [{ name: 'Small' }] });
        await expect(
            removeItemFromVariantType(created.id, '000000000000000000000000'),
        ).rejects.toThrow(AppError);
    });
});
