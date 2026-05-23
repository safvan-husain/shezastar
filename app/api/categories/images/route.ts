import { NextResponse } from 'next/server';
import { saveImage } from '@/lib/utils/file-upload';
import { withRequestLogging } from '@/lib/logging/request-logger';
import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { SEO_ADMIN_ROLES } from '@/lib/auth/admin-permissions';
import { catchError } from '@/lib/errors/app-error';

async function POSTHandler(req: Request) {
    try {
        await requireAdminApiAuth({ roles: [...SEO_ADMIN_ROLES] });

        const formData = await req.formData();
        const image = formData.get('image');

        if (!(image instanceof File) || image.size === 0) {
            return NextResponse.json({ error: 'Category image is required' }, { status: 400 });
        }

        const imagePath = await saveImage(image);
        return NextResponse.json({ imagePath }, { status: 200 });
    } catch (error) {
        const { status, body } = catchError(error);
        return NextResponse.json(body, { status });
    }
}

export const POST = withRequestLogging(POSTHandler);
