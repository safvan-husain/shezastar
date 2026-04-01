import { NextRequest, NextResponse } from 'next/server';
import { catchError } from '@/lib/errors/app-error';
import { getStorefrontSessionId, revokeStorefrontSession } from '@/lib/storefront-session';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function POSTHandler(req: NextRequest) {
    try {
        const sessionId = await getStorefrontSessionId();
        await revokeStorefrontSession(sessionId || undefined);

        return NextResponse.json({ status: 'success' });
    } catch (err) {
        const { status, body } = catchError(err);
        return NextResponse.json(body, { status });
    }
}

export const POST = withRequestLogging(POSTHandler);
