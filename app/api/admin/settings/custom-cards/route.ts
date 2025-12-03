import { NextResponse } from 'next/server';
import { handleGetCustomCards } from '@/lib/app-settings/app-settings.controller';

export async function GET() {
    const result = await handleGetCustomCards();
    return NextResponse.json(result.body, { status: result.status });
}
