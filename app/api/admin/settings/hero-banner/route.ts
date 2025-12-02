import { NextResponse } from 'next/server';
import { handleUpdateHeroBanner } from '@/lib/app-settings/app-settings.controller';

export async function PATCH(req: Request) {
    const body = await req.json();
    const { status, body: result } = await handleUpdateHeroBanner(body);
    return NextResponse.json(result, { status });
}
