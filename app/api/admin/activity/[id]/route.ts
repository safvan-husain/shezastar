import { NextResponse } from 'next/server';

import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { catchError } from '@/lib/errors/app-error';
import { handleGetActivityLog } from '@/lib/activity/activity.controller';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function GETHandler(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireAdminApiAuth();
        const { id } = await params;
        const { status, body } = await handleGetActivityLog(id);
        return NextResponse.json(body, { status });
    } catch (error) {
        const handled = catchError(error);
        return NextResponse.json(handled.body, { status: handled.status });
    }
}

export const GET = withRequestLogging(GETHandler);
