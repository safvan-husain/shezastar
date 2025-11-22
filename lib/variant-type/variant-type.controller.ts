// lib/variant-type/variant-type.controller.ts
import { catchError } from '@/lib/errors/app-error';
import {
    CreateVariantTypeSchema,
    UpdateVariantTypeSchema,
    AddItemSchema,
} from './variant-type.schema';
import * as variantTypeService from './variant-type.service';

export async function handleCreateVariantType(input: unknown) {
    try {
        const parsed = CreateVariantTypeSchema.parse(input);
        const result = await variantTypeService.createVariantType(parsed);
        return { status: 201, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleGetVariantType(id: string) {
    try {
        const result = await variantTypeService.getVariantType(id);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleGetAllVariantTypes() {
    try {
        const result = await variantTypeService.getAllVariantTypes();
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleUpdateVariantType(id: string, input: unknown) {
    try {
        const parsed = UpdateVariantTypeSchema.parse(input);
        const result = await variantTypeService.updateVariantType(id, parsed);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleDeleteVariantType(id: string) {
    try {
        const result = await variantTypeService.deleteVariantType(id);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleAddItem(id: string, input: unknown) {
    try {
        const parsed = AddItemSchema.parse(input);
        const result = await variantTypeService.addItemToVariantType(id, parsed);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleRemoveItem(id: string, itemId: string) {
    try {
        const result = await variantTypeService.removeItemFromVariantType(id, itemId);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}
