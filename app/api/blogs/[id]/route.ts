import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import {
    handleDeleteBlog,
    handleGetBlog,
    handleUpdateBlog,
} from '@/lib/blog/blog.controller';
import { revalidateBlogPages } from '@/lib/blog/blog-cache';
import type { Blog } from '@/lib/blog/model/blog.model';
import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { SUPER_ADMIN_ROLES } from '@/lib/auth/admin-permissions';
import { catchError } from '@/lib/errors/app-error';
import { withRequestLogging } from '@/lib/logging/request-logger';
import { saveImage } from '@/lib/utils/file-upload';

async function GETHandler(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    await requireAdminApiAuth({ roles: [...SUPER_ADMIN_ROLES] });
    const { id } = await params;
    const { status, body } = await handleGetBlog(id);
    return NextResponse.json(body, { status });
}

async function PUTHandler(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdminApiAuth({ roles: [...SUPER_ADMIN_ROLES] });
        const { id } = await params;
        const contentType = req.headers.get('content-type');
        let input: Record<string, unknown>;

        if (contentType?.includes('multipart/form-data')) {
            const formData = await req.formData();
            const imageFile = formData.get('coverImage') as File | null;
            const imageUrl = imageFile && imageFile.size > 0 ? await saveImage(imageFile) : undefined;

            input = {
                title: formData.get('title'),
                excerpt: formData.get('excerpt'),
                content: formData.get('content'),
                coverImageUrl: imageUrl || formData.get('coverImageUrl') || undefined,
                status: formData.get('status'),
            };
        } else {
            input = await req.json();
        }

        const { status, body } = await handleUpdateBlog(id, input);
        if (status < 400) {
            revalidateBlogPages((body as Blog).slug);
        }
        revalidatePath('/manage/blogs', 'page');

        return NextResponse.json(body, { status });
    } catch (error) {
        const handled = catchError(error);
        return NextResponse.json(handled.body, { status: handled.status });
    }
}

async function DELETEHandler(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await requireAdminApiAuth({ roles: [...SUPER_ADMIN_ROLES] });
        const { id } = await params;
        const existing = await handleGetBlog(id);
        const { status, body } = await handleDeleteBlog(id);
        if (status < 400) {
            revalidateBlogPages((existing.body as Blog).slug);
        }
        revalidatePath('/manage/blogs', 'page');

        return NextResponse.json(body, { status });
    } catch (error) {
        const handled = catchError(error);
        return NextResponse.json(handled.body, { status: handled.status });
    }
}

export const GET = withRequestLogging(GETHandler);
export const PUT = withRequestLogging(PUTHandler);
export const DELETE = withRequestLogging(DELETEHandler);
