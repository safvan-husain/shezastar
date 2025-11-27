// app/api/products/[id]/route.ts
import { NextResponse } from 'next/server';
import {
    handleGetProduct,
    handleUpdateProduct,
    handleDeleteProduct,
} from '@/lib/product/product.controller';
import { saveImages } from '@/lib/utils/file-upload';
import { nanoid } from 'nanoid';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { status, body } = await handleGetProduct(id);
    return NextResponse.json(body, { status });
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const contentType = req.headers.get('content-type');

        // Check if it's FormData (multipart) or JSON
        if (contentType?.includes('multipart/form-data')) {
            const formData = await req.formData();

            // Extract basic product data
            const name = formData.get('name') as string | null;
            const description = formData.get('description') as string | null;
            const basePrice = formData.get('basePrice') ? parseFloat(formData.get('basePrice') as string) : undefined;
            const offerPrice = formData.get('offerPrice') ? parseFloat(formData.get('offerPrice') as string) : undefined;
            const variants = formData.get('variants') ? JSON.parse(formData.get('variants') as string) : undefined;
            const subCategoryIds = formData.get('subCategoryIds') ? JSON.parse(formData.get('subCategoryIds') as string) : undefined;
            const existingImages = JSON.parse(formData.get('existingImages') as string || '[]');

            // Handle new image uploads
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

            const productData: any = {};
            if (name) productData.name = name;
            if (description !== null) productData.description = description;
            if (basePrice !== undefined) productData.basePrice = basePrice;
            if (offerPrice !== undefined) productData.offerPrice = offerPrice;
            if (variants !== undefined) productData.variants = variants;
            if (subCategoryIds !== undefined) productData.subCategoryIds = subCategoryIds;
            productData.images = allImages;

            const { status, body } = await handleUpdateProduct(id, productData);
            return NextResponse.json(body, { status });
        } else {
            // Handle JSON request (backward compatibility)
            const data = await req.json();
            const { status, body } = await handleUpdateProduct(id, data);
            return NextResponse.json(body, { status });
        }
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to update product' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { status, body } = await handleDeleteProduct(id);
    return NextResponse.json(body, { status });
}
