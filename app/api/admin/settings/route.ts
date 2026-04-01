import { NextResponse } from 'next/server';
import { handleGetAppSettings } from '@/lib/app-settings/app-settings.controller';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function GETHandler(_req: Request) {
    const { status, body } = await handleGetAppSettings();
    return NextResponse.json(body, { status });
}

export const GET = withRequestLogging(GETHandler);
