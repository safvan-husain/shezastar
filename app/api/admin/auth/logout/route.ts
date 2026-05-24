import { NextResponse } from 'next/server';

import { revokeAdminSessionCookie } from '@/lib/auth/admin-auth';
import { catchError } from '@/lib/errors/app-error';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function POSTHandler() {
    try {
        await revokeAdminSessionCookie();

        return NextResponse.json({ status: 'success' });
    } catch (error) {
        const { status, body } = catchError(error);
        return NextResponse.json(body, { status });
    }
}

export const POST = withRequestLogging(POSTHandler);
