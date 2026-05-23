import { NextResponse } from 'next/server';
import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { SEO_ADMIN_ROLES } from '@/lib/auth/admin-permissions';
import { handleGetStaticPageSeoSettings } from '@/lib/app-settings/app-settings.controller';
import { catchError } from '@/lib/errors/app-error';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function GETHandler(_req: Request) {
    try {
        await requireAdminApiAuth({ roles: [...SEO_ADMIN_ROLES] });
        const { status, body } = await handleGetStaticPageSeoSettings();
        return NextResponse.json(body, { status });
    } catch (error) {
        const { status, body } = catchError(error);
        return NextResponse.json(body, { status });
    }
}

export const GET = withRequestLogging(GETHandler);
