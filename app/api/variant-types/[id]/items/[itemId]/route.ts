// app/api/variant-types/[id]/items/[itemId]/route.ts
import { NextResponse } from 'next/server';
import {
    handleRemoveItem,
} from '@/lib/variant-type/variant-type.controller';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; itemId: string }> }
) {
    const { id, itemId } = await params;
    const { status, body } = await handleRemoveItem(id, itemId);
    return NextResponse.json(body, { status });
}
