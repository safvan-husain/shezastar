import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';
import { handleCreateBlog, handleGetAllBlogs } from '@/lib/blog/blog.controller';
import { revalidateBlogPages } from '@/lib/blog/blog-cache';
import type { Blog } from '@/lib/blog/model/blog.model';
import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { SUPER_ADMIN_ROLES } from '@/lib/auth/admin-permissions';
import { catchError } from '@/lib/errors/app-error';
import { withRequestLogging } from '@/lib/logging/request-logger';
import { saveImage } from '@/lib/utils/file-upload';

function withNoStoreHeaders(headers?: HeadersInit) {
    return {
        'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
        Pragma: 'no-cache',
        ...headers,
    };
}

async function GETHandler(req: Request) {
    const { searchParams } = new URL(req.url);
    const requestedStatus = searchParams.get('status');
    const status = requestedStatus === 'draft' || requestedStatus === 'all' ? requestedStatus : 'published';

    if (status !== 'published') {
        await requireAdminApiAuth({ roles: [...SUPER_ADMIN_ROLES] });
    }

    const { status: responseStatus, body } = await handleGetAllBlogs(status);
    return NextResponse.json(body, {
        status: responseStatus,
        headers: withNoStoreHeaders(),
    });
}

async function POSTHandler(req: Request) {
    try {
        await requireAdminApiAuth({ roles: [...SUPER_ADMIN_ROLES] });
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
                status: formData.get('status') || 'draft',
            };
        } else {
            input = await req.json();
        }

        const { status, body } = await handleCreateBlog(input);
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

export const GET = withRequestLogging(GETHandler);
export const POST = withRequestLogging(POSTHandler);
