// app/api/variant-types/[id]/items/route.ts
import { NextResponse } from 'next/server';
import {
    handleAddItem,
} from '@/lib/variant-type/variant-type.controller';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function POSTHandler(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const data = await req.json();
    const { status, body } = await handleAddItem(id, data);
    return NextResponse.json(body, { status });
}

export const POST = withRequestLogging(POSTHandler);
