// app/api/products/[id]/images/route.ts
import { NextResponse } from 'next/server';
import { handleAddImages } from '@/lib/product/product.controller';
import { saveImages } from '@/lib/utils/file-upload';
import { nanoid } from 'nanoid';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const formData = await req.formData();
        const files = formData.getAll('images') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: 'No images provided' },
                { status: 400 }
            );
        }

        // Save images to disk
        const urls = await saveImages(files);

        // Create image objects
        const images = urls.map((url, index) => ({
            id: nanoid(),
            url,
            mappedVariants: [],
            order: index,
        }));

        // Add to product
        const { status, body } = await handleAddImages(id, images);
        return NextResponse.json(body, { status });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Failed to upload images' },
            { status: 500 }
        );
    }
}
