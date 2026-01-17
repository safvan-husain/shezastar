// app/api/brands/route.ts
import { NextResponse } from 'next/server';
import { handleGetAllBrands, handleCreateBrand } from '@/lib/brand/brand.controller';
import { saveImage } from '@/lib/utils/file-upload';

export async function GET() {
    const { status, body } = await handleGetAllBrands();
    return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
    try {
        const contentType = req.headers.get('content-type');

        if (contentType?.includes('multipart/form-data')) {
            const formData = await req.formData();
            const name = formData.get('name') as string;
            const imageFile = formData.get('image') as File;

            if (!name || !imageFile) {
                return NextResponse.json({ error: 'Name and image are required' }, { status: 400 });
            }

            const imageUrl = await saveImage(imageFile);

            const { status, body } = await handleCreateBrand({ name, imageUrl });
            return NextResponse.json(body, { status });
        }

        const data = await req.json();
        const { status, body } = await handleCreateBrand(data);
        return NextResponse.json(body, { status });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
