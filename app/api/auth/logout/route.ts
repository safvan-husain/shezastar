import { NextRequest, NextResponse } from 'next/server';
import { catchError } from '@/lib/errors/app-error';
import { getStorefrontSessionId, revokeStorefrontSession } from '@/lib/storefront-session';

export async function POST(req: NextRequest) {
    try {
        const sessionId = await getStorefrontSessionId();
        await revokeStorefrontSession(sessionId || undefined);

        return NextResponse.json({ status: 'success' });
    } catch (err) {
        const { status, body } = catchError(err);
        return NextResponse.json(body, { status });
    }
}
