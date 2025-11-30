'use server';

import { revalidatePath } from 'next/cache';
import { nanoid } from 'nanoid';
import { catchError } from '@/lib/errors/app-error';
import { saveImages, deleteImages } from '@/lib/utils/file-upload';
import {
    CreateProductSchema,
    UpdateProductSchema,
    ProductImageInput,
} from '@/lib/validations/product.schema';
import * as productService from '@/lib/services/product.service';

export type ActionResponse<T> =
    | { success: true; data: T }
    | { success: false; error: ReturnType<typeof catchError>['body'] };

function parseImagesFromFormData(formData: FormData): ProductImageInput[] {
    const existingImages = JSON.parse(formData.get('existingImages') as string || '[]') as ProductImageInput[];
    const uploadedFiles = formData.getAll('newImages') as File[];

    const newImagesMeta: ProductImageInput[] = uploadedFiles.map((file, index) => {
        const metaStr = formData.get(`newImageMeta_${index}`) as string;
        const meta = metaStr ? JSON.parse(metaStr) : {};

        return {
            id: meta.tempId || nanoid(),
            url: '',
            mappedVariants: meta.mappedVariants || [],
            order: meta.order ?? existingImages.length + index,
        };
    });

    return [...existingImages, ...newImagesMeta];
}

async function uploadNewImages(formData: FormData) {
    const files = formData.getAll('newImages') as File[];
    if (!files.length) return [] as string[];
    return saveImages(files);
}

function replaceUploadedUrls(images: ProductImageInput[], urls: string[]) {
    let uploadedIndex = 0;
    return images.map(img => {
        if (!img.url) {
            const url = urls[uploadedIndex];
            uploadedIndex += 1;
            return { ...img, url };
        }
        return img;
    });
}

export async function createProductAction(formData: FormData): Promise<ActionResponse<any>> {
    try {
        const uploadedUrls = await uploadNewImages(formData);
        const images = replaceUploadedUrls(parseImagesFromFormData(formData), uploadedUrls);

        const parsed = CreateProductSchema.parse({
            name: formData.get('name'),
            description: formData.get('description') || undefined,
            basePrice: Number(formData.get('basePrice')),
            offerPrice: formData.get('offerPrice') ? Number(formData.get('offerPrice')) : undefined,
            variants: JSON.parse((formData.get('variants') as string) || '[]'),
            subCategoryIds: JSON.parse((formData.get('subCategoryIds') as string) || '[]'),
            installationService: formData.get('installationService')
                ? JSON.parse(formData.get('installationService') as string)
                : undefined,
            images,
        });

        const product = await productService.createProduct(parsed);
        revalidatePath('/products');
        return { success: true, data: product };
    } catch (err) {
        if ((err as any)?.body?.details?.uploaded) {
            await deleteImages((err as any).body.details.uploaded as string[]);
        }
        const { body } = catchError(err);
        return { success: false, error: body };
    }
}

export async function updateProductAction(productId: string, formData: FormData): Promise<ActionResponse<any>> {
    try {
        const uploadedUrls = await uploadNewImages(formData);
        const images = replaceUploadedUrls(parseImagesFromFormData(formData), uploadedUrls);

        const parsed = UpdateProductSchema.parse({
            name: formData.get('name') || undefined,
            description: formData.get('description') || undefined,
            basePrice: formData.get('basePrice') ? Number(formData.get('basePrice')) : undefined,
            offerPrice: formData.get('offerPrice') ? Number(formData.get('offerPrice')) : undefined,
            variants: formData.get('variants') ? JSON.parse(formData.get('variants') as string) : undefined,
            subCategoryIds: formData.get('subCategoryIds') ? JSON.parse(formData.get('subCategoryIds') as string) : undefined,
            installationService: formData.get('installationService')
                ? JSON.parse(formData.get('installationService') as string)
                : undefined,
            images,
        });

        const product = await productService.updateProduct(productId, parsed);
        revalidatePath('/products');
        revalidatePath(`/products/${productId}/edit`);
        return { success: true, data: product };
    } catch (err) {
        const { body } = catchError(err);
        return { success: false, error: body };
    }
}

export async function deleteProductAction(productId: string): Promise<ActionResponse<{ success: true }>> {
    try {
        await productService.deleteProduct(productId);
        revalidatePath('/products');
        return { success: true, data: { success: true } };
    } catch (err) {
        const { body } = catchError(err);
        return { success: false, error: body };
    }
}
