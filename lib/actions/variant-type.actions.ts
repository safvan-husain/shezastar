'use server';

import { revalidatePath } from 'next/cache';
import { catchError } from '@/lib/errors/app-error';
import {
    AddItemSchema,
    CreateVariantTypeSchema,
    UpdateVariantTypeSchema,
} from '@/lib/validations/variant-type.schema';
import * as variantTypeService from '@/lib/services/variant-type.service';

export type ActionResponse<T> =
    | { success: true; data: T }
    | { success: false; error: ReturnType<typeof catchError>['body'] };

function revalidateVariantTypePaths(variantTypeId?: string) {
    revalidatePath('/variant-types');
    revalidatePath('/products/new');
    revalidatePath('/products/[id]/edit', 'page');

    if (variantTypeId) {
        revalidatePath(`/variant-types/${variantTypeId}/edit`);
    }
}

export async function createVariantTypeAction(formData: FormData): Promise<ActionResponse<any>> {
    try {
        const parsed = CreateVariantTypeSchema.parse({
            name: formData.get('name'),
            items: formData.get('items')
                ? JSON.parse(formData.get('items') as string)
                : [],
        });

        const variantType = await variantTypeService.createVariantType(parsed);
        revalidateVariantTypePaths(variantType.id);

        return { success: true, data: variantType };
    } catch (err) {
        const { body } = catchError(err);
        return { success: false, error: body };
    }
}

export async function updateVariantTypeAction(
    variantTypeId: string,
    formData: FormData,
): Promise<ActionResponse<any>> {
    try {
        const parsed = UpdateVariantTypeSchema.parse({
            name: formData.get('name') || undefined,
            items: formData.get('items')
                ? JSON.parse(formData.get('items') as string)
                : undefined,
        });

        const variantType = await variantTypeService.updateVariantType(variantTypeId, parsed);
        revalidateVariantTypePaths(variantTypeId);

        return { success: true, data: variantType };
    } catch (err) {
        const { body } = catchError(err);
        return { success: false, error: body };
    }
}

export async function deleteVariantTypeAction(
    variantTypeId: string,
): Promise<ActionResponse<{ success: true }>> {
    try {
        await variantTypeService.deleteVariantType(variantTypeId);
        revalidateVariantTypePaths(variantTypeId);

        return { success: true, data: { success: true } };
    } catch (err) {
        const { body } = catchError(err);
        return { success: false, error: body };
    }
}

export async function addVariantItemAction(
    variantTypeId: string,
    formData: FormData,
): Promise<ActionResponse<any>> {
    try {
        const parsed = AddItemSchema.parse({
            name: formData.get('name'),
            metadata: formData.get('metadata')
                ? JSON.parse(formData.get('metadata') as string)
                : undefined,
        });

        const variantType = await variantTypeService.addItemToVariantType(variantTypeId, parsed);
        revalidateVariantTypePaths(variantTypeId);

        return { success: true, data: variantType };
    } catch (err) {
        const { body } = catchError(err);
        return { success: false, error: body };
    }
}

export async function removeVariantItemAction(
    variantTypeId: string,
    itemId: string,
): Promise<ActionResponse<any>> {
    try {
        const variantType = await variantTypeService.removeItemFromVariantType(variantTypeId, itemId);
        revalidateVariantTypePaths(variantTypeId);

        return { success: true, data: variantType };
    } catch (err) {
        const { body } = catchError(err);
        return { success: false, error: body };
    }
}
