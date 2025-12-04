import { NextResponse } from 'next/server';
import { ensureStorefrontSession } from '@/lib/storefront-session';

export async function GET() {
    try {
        const session = await ensureStorefrontSession();
        return NextResponse.json({ sessionId: session.sessionId });
    } catch (error) {
        console.error('Failed to ensure session:', error);
        return NextResponse.json(
            { error: 'Failed to create session' },
            { status: 500 }
        );
    }
}
