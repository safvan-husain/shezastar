import { NextResponse } from 'next/server';
import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { SEO_ADMIN_ROLES } from '@/lib/auth/admin-permissions';
import { getProductsSeoList } from '@/lib/product/product.service';
import { catchError } from '@/lib/errors/app-error';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function GETHandler(req: Request) {
    try {
        await requireAdminApiAuth({ roles: [...SEO_ADMIN_ROLES] });

        const url = new URL(req.url);
        const page = Number(url.searchParams.get('page') || '1');
        const limit = Number(url.searchParams.get('limit') || '20');
        const search = url.searchParams.get('search') || undefined;

        const result = await getProductsSeoList(page, limit, search);
        return NextResponse.json(result);
    } catch (error) {
        const { status, body } = catchError(error);
        return NextResponse.json(body, { status });
    }
}

export const GET = withRequestLogging(GETHandler);
