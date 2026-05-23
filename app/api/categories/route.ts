// app/api/categories/route.ts
import { NextResponse } from 'next/server';
import {
    handleGetAllCategories,
    handleCreateCategory,
} from '@/lib/category/category.controller';
import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { SUPER_ADMIN_ROLES } from '@/lib/auth/admin-permissions';
import { catchError } from '@/lib/errors/app-error';
import { withRequestLogging } from '@/lib/logging/request-logger';
import { revalidateCategoryCache } from '@/lib/category/category-cache';

function withNoStoreHeaders(headers?: HeadersInit) {
    return {
        'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
        Pragma: 'no-cache',
        ...headers,
    };
}

async function GETHandler(_req: Request) {
    const { status, body } = await handleGetAllCategories();
    return NextResponse.json(body, { status, headers: withNoStoreHeaders() });
}

async function POSTHandler(req: Request) {
    try {
        await requireAdminApiAuth({ roles: [...SUPER_ADMIN_ROLES] });
        const data = await req.json();
        const { status, body } = await handleCreateCategory(data);
        if (status < 400) {
            revalidateCategoryCache();
        }
        return NextResponse.json(body, { status });
    } catch (error) {
        const { status, body } = catchError(error);
        return NextResponse.json(body, { status });
    }
}

export const GET = withRequestLogging(GETHandler);
export const POST = withRequestLogging(POSTHandler);
