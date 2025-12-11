// app/api/products/route.ts
import { NextResponse } from 'next/server';
import {
    handleGetAllProducts,
    handleCreateProduct,
} from '@/lib/product/product.controller';
import { saveImages } from '@/lib/utils/file-upload';
import { nanoid } from 'nanoid';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const categoryId = searchParams.get('categoryId') || searchParams.get('subCategoryId') || undefined;

    const { status, body } = await handleGetAllProducts(page, limit, categoryId);
    return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
    try {
        const contentType = req.headers.get('content-type');

        // Support both JSON (used by tests) and multipart/form-data (used by the app)
        if (contentType?.includes('multipart/form-data')) {
            const formData = await req.formData();

            // Extract basic product data
            const name = formData.get('name') as string;
            const description = formData.get('description') as string | null;
            const basePrice = parseFloat(formData.get('basePrice') as string);
            const offerPrice = formData.get('offerPrice') ? parseFloat(formData.get('offerPrice') as string) : undefined;
            const highlights = formData.get('highlights')
                ? JSON.parse(formData.get('highlights') as string)
                : undefined;
            const variants = JSON.parse(formData.get('variants') as string || '[]');
            const variantStock = JSON.parse(formData.get('variantStock') as string || '[]');
            const subCategoryIds = JSON.parse(formData.get('subCategoryIds') as string || '[]');
            const installationService = formData.get('installationService') ? JSON.parse(formData.get('installationService') as string) : undefined;
            const existingImages = JSON.parse(formData.get('existingImages') as string || '[]');

            // Handle new image uploads
            const newImagesCount = parseInt(formData.get('newImagesCount') as string || '0');
            const newImageFiles = formData.getAll('newImages') as File[];

            let uploadedImages: any[] = [];
            if (newImageFiles.length > 0) {
                const urls = await saveImages(newImageFiles);

                // Map uploaded URLs with metadata
                uploadedImages = urls.map((url, index) => {
                    const metaStr = formData.get(`newImageMeta_${index}`) as string;
                    const meta = metaStr ? JSON.parse(metaStr) : {};

                    return {
                        id: nanoid(),
                        url,
                        mappedVariants: meta.mappedVariants || [],
                        order: meta.order ?? (existingImages.length + index),
                    };
                });
            }

            // Combine existing and new images
            const allImages = [...existingImages, ...uploadedImages];

            const productData = {
                name,
                description,
                basePrice,
                offerPrice,
                highlights,
                images: allImages,
                variants,
                variantStock,
                subCategoryIds,
                installationService,
            };

            const { status, body } = await handleCreateProduct(productData);
            return NextResponse.json(body, { status });
        }

        const jsonData = await req.json();
        const { status, body } = await handleCreateProduct(jsonData);
        return NextResponse.json(body, { status });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to create product' },
            { status: 500 }
        );
    }
}
