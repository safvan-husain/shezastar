import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { handleUpdateHeroBanner, handleDeleteHeroBanner } from '@/lib/app-settings/app-settings.controller';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await req.json();
    const { status, body: result } = await handleUpdateHeroBanner(id, body);
    try {
        revalidatePath('/(admin)/settings/hero-banners', 'page');
    } catch (error) {
        // Ignore revalidation errors in test environment
    }
    return NextResponse.json(result, { status });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { status, body: result } = await handleDeleteHeroBanner(id);
    try {
        revalidatePath('/(admin)/settings/hero-banners', 'page');
    } catch (error) {
        // Ignore revalidation errors in test environment
    }
    return NextResponse.json(result, { status });
}
