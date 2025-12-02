import { NextResponse } from 'next/server';
import { handleGetAppSettings } from '@/lib/app-settings/app-settings.controller';

export async function GET() {
    const { status, body } = await handleGetAppSettings();
    return NextResponse.json(body, { status });
}
