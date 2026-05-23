import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
    handleGetStaticPageSeoSettings,
    handleUpdateStaticPageSeoEntry,
} from '@/lib/app-settings/app-settings.controller';
import { revalidateStaticPageSeoCache } from '@/lib/app-settings/app-settings-cache';
import { deleteImage, saveImage } from '@/lib/utils/file-upload';
import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { SEO_ADMIN_ROLES } from '@/lib/auth/admin-permissions';
import { catchError } from '@/lib/errors/app-error';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function updateSeoEntry(
    req: Request,
    { params }: { params: Promise<{ key: string }> }
) {
    const { key } = await params;

    try {
        await requireAdminApiAuth({ roles: [...SEO_ADMIN_ROLES] });

        const formData = await req.formData();
        const imageFile = formData.get('ogImageFile') as File | null;
        const currentImagePath = (formData.get('currentOgImage') as string | null)?.trim() || undefined;
        const removeImage = formData.get('removeOgImage') === 'true';
        const title = (formData.get('title') as string | null)?.trim() || '';
        const metaDescription = (formData.get('metaDescription') as string | null)?.trim() || '';

        let ogImagePath = currentImagePath;

        if (imageFile && imageFile.size > 0) {
            if (currentImagePath) {
                await deleteImage(currentImagePath);
            }
            ogImagePath = await saveImage(imageFile);
        } else if (removeImage && currentImagePath) {
            await deleteImage(currentImagePath);
            ogImagePath = undefined;
        }

        const payload = {
            title,
            metaDescription,
            ...(ogImagePath ? { ogImage: ogImagePath } : {}),
        };

        const { status, body } = await handleUpdateStaticPageSeoEntry(key, payload);

        revalidatePath('/manage/settings/seo', 'page');
        revalidatePath('/manage/seo/static-pages', 'page');
        revalidatePath('/(store)', 'layout');
        revalidateStaticPageSeoCache();

        return NextResponse.json(body, { status });
    } catch (error) {
        const { status, body } = catchError(error);
        return NextResponse.json(body, { status });
    }
}

async function GETHandler(_req: Request, { params }: { params: Promise<{ key: string }> }) {
    const { key } = await params;

    try {
        await requireAdminApiAuth({ roles: [...SEO_ADMIN_ROLES] });
        const { status, body } = await handleGetStaticPageSeoSettings();
        if (status !== 200) {
            return NextResponse.json(body, { status });
        }

        const entry = (body as Record<string, unknown>)[key];
        if (!entry) {
            return NextResponse.json({ message: 'SEO key not found' }, { status: 404 });
        }

        return NextResponse.json(entry, { status: 200 });
    } catch (error) {
        const { status, body } = catchError(error);
        return NextResponse.json(body, { status });
    }
}

export const GET = withRequestLogging(GETHandler);
export const PATCH = withRequestLogging(updateSeoEntry);
export const PUT = withRequestLogging(updateSeoEntry);
