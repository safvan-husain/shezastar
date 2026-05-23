import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
    handleGetStaticPageSeoSettings,
    handleUpdateStaticPageSeoEntry,
} from '@/lib/app-settings/app-settings.controller';
import { revalidateStaticPageSeoCache } from '@/lib/app-settings/app-settings-cache';
import { deleteImage, saveImage } from '@/lib/utils/file-upload';
import { requireAdminAuth } from '@/lib/auth/admin-auth';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function updateSeoEntry(
    req: Request,
    { params }: { params: Promise<{ key: string }> }
) {
    const { key } = await params;

    try {
        await requireAdminAuth();

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
        revalidatePath('/(store)', 'layout');
        revalidateStaticPageSeoCache();

        return NextResponse.json(body, { status });
    } catch (error: any) {
        if (error?.digest?.includes('NEXT_REDIRECT')) throw error;
        return NextResponse.json(
            { message: error?.message ?? 'Failed to update static page SEO' },
            { status: error?.status ?? 500 }
        );
    }
}

async function GETHandler(_req: Request, { params }: { params: Promise<{ key: string }> }) {
    const { key } = await params;

    try {
        await requireAdminAuth();
        const { status, body } = await handleGetStaticPageSeoSettings();
        if (status !== 200) {
            return NextResponse.json(body, { status });
        }

        const entry = (body as Record<string, unknown>)[key];
        if (!entry) {
            return NextResponse.json({ message: 'SEO key not found' }, { status: 404 });
        }

        return NextResponse.json(entry, { status: 200 });
    } catch (error: any) {
        if (error?.digest?.includes('NEXT_REDIRECT')) throw error;
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
}

export const GET = withRequestLogging(GETHandler);
export const PATCH = withRequestLogging(updateSeoEntry);
export const PUT = withRequestLogging(updateSeoEntry);
