// lib/product/product.controller.ts
import { catchError } from '@/lib/errors/app-error';
import {
    CreateProductSchema,
    UpdateProductSchema,
    ImageMappingSchema,
    ProductImageSchema,
} from './product.schema';
import * as productService from './product.service';
import { z } from 'zod';

export async function handleCreateProduct(input: unknown) {
    try {
        const parsed = CreateProductSchema.parse(input);
        const result = await productService.createProduct(parsed);
        return { status: 201, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleGetProduct(id: string) {
    try {
        const result = await productService.getProduct(id);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleGetAllProducts(page?: number, limit?: number, categoryId?: string | string[], originId?: string) {
    try {
        const result = await productService.getAllProducts(page, limit, categoryId, originId);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleUpdateProduct(id: string, input: unknown) {
    try {
        const parsed = UpdateProductSchema.parse(input);
        const result = await productService.updateProduct(id, parsed);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleDeleteProduct(id: string) {
    try {
        const result = await productService.deleteProduct(id);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleAddImages(id: string, input: unknown) {
    try {
        const parsed = z.array(ProductImageSchema).parse(input);
        const result = await productService.addProductImages(id, parsed);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleDeleteImage(id: string, imageId: string) {
    try {
        const result = await productService.deleteProductImage(id, imageId);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleMapImages(id: string, input: unknown) {
    try {
        const parsed = z.array(ImageMappingSchema).parse(input);
        const result = await productService.mapImageToVariants(id, parsed);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}
