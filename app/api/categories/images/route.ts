import { NextResponse } from 'next/server';
import { saveImage } from '@/lib/utils/file-upload';
import { withRequestLogging } from '@/lib/logging/request-logger';
import { requireAdminApiAuth } from '@/lib/auth/admin-auth';

async function POSTHandler(req: Request) {
    try {
        await requireAdminApiAuth();

        const formData = await req.formData();
        const image = formData.get('image');

        if (!(image instanceof File) || image.size === 0) {
            return NextResponse.json({ error: 'Category image is required' }, { status: 400 });
        }

        const imagePath = await saveImage(image);
        return NextResponse.json({ imagePath }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || 'Failed to upload category image' },
            { status: 500 }
        );
    }
}

export const POST = withRequestLogging(POSTHandler);
