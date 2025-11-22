// app/api/variant-types/[id]/route.ts
import { NextResponse } from 'next/server';
import {
    handleGetVariantType,
    handleUpdateVariantType,
    handleDeleteVariantType,
} from '@/lib/variant-type/variant-type.controller';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { status, body } = await handleGetVariantType(id);
    return NextResponse.json(body, { status });
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const data = await req.json();
    const { status, body } = await handleUpdateVariantType(id, data);
    return NextResponse.json(body, { status });
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { status, body } = await handleDeleteVariantType(id);
    return NextResponse.json(body, { status });
}
