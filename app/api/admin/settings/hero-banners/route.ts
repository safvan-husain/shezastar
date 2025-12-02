import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { handleGetHeroBanners, handleCreateHeroBanner } from '@/lib/app-settings/app-settings.controller';

export async function GET() {
    const { status, body } = await handleGetHeroBanners();
    return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
    const body = await req.json();
    const { status, body: result } = await handleCreateHeroBanner(body);
    try {
        revalidatePath('/(admin)/settings/hero-banners', 'page');
    } catch (error) {
        // Ignore revalidation errors in test environment
    }
    return NextResponse.json(result, { status });
}
