import { NextResponse } from 'next/server';

import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { SUPER_ADMIN_ROLES } from '@/lib/auth/admin-permissions';
import { catchError } from '@/lib/errors/app-error';
import { handleGetDashboardAnalytics } from '@/lib/activity/activity.controller';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function GETHandler(_req: Request) {
    try {
        await requireAdminApiAuth({ roles: [...SUPER_ADMIN_ROLES] });
        const { status, body } = await handleGetDashboardAnalytics();
        return NextResponse.json(body, { status });
    } catch (error) {
        const handled = catchError(error);
        return NextResponse.json(handled.body, { status: handled.status });
    }
}

export const GET = withRequestLogging(GETHandler);
