// app/api/categories/[id]/subcategories/[subId]/route.ts
import { NextResponse } from 'next/server';
import { handleRemoveSubCategory, handleUpdateSubCategory } from '@/lib/category/category.controller';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function DELETEHandler(
    req: Request,
    { params }: { params: Promise<{ id: string; subId: string }> }
) {
    const { id, subId } = await params;
    const { status, body } = await handleRemoveSubCategory(id, subId);
    return NextResponse.json(body, { status });
}

async function PUTHandler(
    req: Request,
    { params }: { params: Promise<{ id: string; subId: string }> }
) {
    const { id, subId } = await params;
    const data = await req.json();
    const { status, body } = await handleUpdateSubCategory(id, subId, data);
    return NextResponse.json(body, { status });
}

export const DELETE = withRequestLogging(DELETEHandler);
export const PUT = withRequestLogging(PUTHandler);
