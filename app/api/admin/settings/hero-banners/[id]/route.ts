import { NextResponse } from 'next/server';
import { handleUpdateHeroBanner, handleDeleteHeroBanner } from '@/lib/app-settings/app-settings.controller';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const body = await req.json();
    const { status, body: result } = await handleUpdateHeroBanner(params.id, body);
    return NextResponse.json(result, { status });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const { status, body: result } = await handleDeleteHeroBanner(params.id);
    return NextResponse.json(result, { status });
}
