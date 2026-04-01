import { NextResponse } from 'next/server';

import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { catchError } from '@/lib/errors/app-error';
import { handleListActivityLogs } from '@/lib/activity/activity.controller';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function GETHandler(req: Request) {
    try {
        await requireAdminApiAuth();
        const { searchParams } = new URL(req.url);
        const { status, body } = await handleListActivityLogs({
            entityKind: searchParams.get('entityKind') ?? undefined,
            entityId: searchParams.get('entityId') ?? undefined,
            limit: searchParams.get('limit') ?? undefined,
        });
        return NextResponse.json(body, { status });
    } catch (error) {
        const handled = catchError(error);
        return NextResponse.json(handled.body, { status: handled.status });
    }
}

export const GET = withRequestLogging(GETHandler);
