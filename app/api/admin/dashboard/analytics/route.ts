import { NextResponse } from 'next/server';

import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { catchError } from '@/lib/errors/app-error';
import { handleGetDashboardAnalytics } from '@/lib/activity/activity.controller';

export async function GET() {
    try {
        await requireAdminApiAuth();
        const { status, body } = await handleGetDashboardAnalytics();
        return NextResponse.json(body, { status });
    } catch (error) {
        const handled = catchError(error);
        return NextResponse.json(handled.body, { status: handled.status });
    }
}
