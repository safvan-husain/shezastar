import { NextResponse } from 'next/server';
import { requireAdminAuth } from '@/lib/auth/admin-auth';
import { handleGetStaticPageSeoSettings } from '@/lib/app-settings/app-settings.controller';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function GETHandler(_req: Request) {
    try {
        await requireAdminAuth();
        const { status, body } = await handleGetStaticPageSeoSettings();
        return NextResponse.json(body, { status });
    } catch (error: any) {
        if (error?.digest?.includes('NEXT_REDIRECT')) throw error;
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
}

export const GET = withRequestLogging(GETHandler);
