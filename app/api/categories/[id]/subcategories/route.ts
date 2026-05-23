// app/api/categories/[id]/subcategories/route.ts
import { NextResponse } from 'next/server';
import { handleAddSubCategory } from '@/lib/category/category.controller';
import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { SUPER_ADMIN_ROLES } from '@/lib/auth/admin-permissions';
import { catchError } from '@/lib/errors/app-error';
import { withRequestLogging } from '@/lib/logging/request-logger';
import { revalidateCategoryCache } from '@/lib/category/category-cache';

async function POSTHandler(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireAdminApiAuth({ roles: [...SUPER_ADMIN_ROLES] });
        const { id } = await params;
        const data = await req.json();
        const { status, body } = await handleAddSubCategory(id, data);
        if (status < 400) {
            revalidateCategoryCache();
        }
        return NextResponse.json(body, { status });
    } catch (error) {
        const { status, body } = catchError(error);
        return NextResponse.json(body, { status });
    }
}

export const POST = withRequestLogging(POSTHandler);
