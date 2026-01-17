// lib/brand/brand.controller.ts
import * as brandService from './brand.service';
import { CreateBrandSchema, UpdateBrandSchema } from './brand.schema';

export async function handleCreateBrand(data: any) {
    try {
        const validatedData = CreateBrandSchema.parse(data);
        const brand = await brandService.createBrand(validatedData);
        return { status: 201, body: brand };
    } catch (error: any) {
        return {
            status: error.name === 'ZodError' ? 400 : 500,
            body: { error: error.message || 'Failed to create brand' }
        };
    }
}

export async function handleGetAllBrands() {
    try {
        const brands = await brandService.getAllBrands();
        return { status: 200, body: brands };
    } catch (error: any) {
        return { status: 500, body: { error: error.message || 'Failed to fetch brands' } };
    }
}

export async function handleGetBrand(id: string) {
    try {
        const brand = await brandService.getBrand(id);
        return { status: 200, body: brand };
    } catch (error: any) {
        return {
            status: error.status || 500,
            body: { error: error.message || 'Failed to fetch brand' }
        };
    }
}

export async function handleUpdateBrand(id: string, data: any) {
    try {
        const validatedData = UpdateBrandSchema.parse(data);
        const brand = await brandService.updateBrand(id, validatedData);
        return { status: 200, body: brand };
    } catch (error: any) {
        return {
            status: error.name === 'ZodError' ? 400 : (error.status || 500),
            body: { error: error.message || 'Failed to update brand' }
        };
    }
}

export async function handleDeleteBrand(id: string) {
    try {
        const result = await brandService.deleteBrand(id);
        return { status: 200, body: result };
    } catch (error: any) {
        return {
            status: error.status || 500,
            body: { error: error.message || 'Failed to delete brand' }
        };
    }
}
