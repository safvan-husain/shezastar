// app/api/variant-types/[id]/items/[itemId]/route.ts
import { NextResponse } from 'next/server';
import {
    handleRemoveItem,
} from '@/lib/variant-type/variant-type.controller';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function DELETEHandler(
    req: Request,
    { params }: { params: Promise<{ id: string; itemId: string }> }
) {
    const { id, itemId } = await params;
    const { status, body } = await handleRemoveItem(id, itemId);
    return NextResponse.json(body, { status });
}

export const DELETE = withRequestLogging(DELETEHandler);
