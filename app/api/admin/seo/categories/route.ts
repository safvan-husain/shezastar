import { NextResponse } from 'next/server';
import { getAllCategories } from '@/lib/category/category.service';
import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { SEO_ADMIN_ROLES } from '@/lib/auth/admin-permissions';
import { catchError } from '@/lib/errors/app-error';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function GETHandler() {
    try {
        await requireAdminApiAuth({ roles: [...SEO_ADMIN_ROLES] });
        const categories = await getAllCategories();
        return NextResponse.json({ categories });
    } catch (error) {
        const { status, body } = catchError(error);
        return NextResponse.json(body, { status });
    }
}

export const GET = withRequestLogging(GETHandler);
