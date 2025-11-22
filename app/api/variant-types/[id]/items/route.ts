// app/api/variant-types/[id]/items/route.ts
import { NextResponse } from 'next/server';
import {
    handleAddItem,
} from '@/lib/variant-type/variant-type.controller';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const data = await req.json();
    const { status, body } = await handleAddItem(id, data);
    return NextResponse.json(body, { status });
}
