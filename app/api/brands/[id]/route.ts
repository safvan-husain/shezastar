// app/api/brands/[id]/route.ts
import { NextResponse } from 'next/server';
import { handleGetBrand, handleUpdateBrand, handleDeleteBrand } from '@/lib/brand/brand.controller';
import { saveImage } from '@/lib/utils/file-upload';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function GETHandler(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { status, body } = await handleGetBrand(id);
    return NextResponse.json(body, { status });
}

async function PUTHandler(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const contentType = req.headers.get('content-type');

        if (contentType?.includes('multipart/form-data')) {
            const formData = await req.formData();
            const name = formData.get('name') as string;
            const imageFile = formData.get('image') as File | null;

            const updateData: any = {};
            if (name) updateData.name = name;

            if (imageFile && imageFile.size > 0) {
                updateData.imageUrl = await saveImage(imageFile);
            }

            const { status, body } = await handleUpdateBrand(id, updateData);
            return NextResponse.json(body, { status });
        }

        const data = await req.json();
        const { status, body } = await handleUpdateBrand(id, data);
        return NextResponse.json(body, { status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

async function DELETEHandler(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { status, body } = await handleDeleteBrand(id);
    return NextResponse.json(body, { status });
}

export const GET = withRequestLogging(GETHandler);
export const PUT = withRequestLogging(PUTHandler);
export const DELETE = withRequestLogging(DELETEHandler);
