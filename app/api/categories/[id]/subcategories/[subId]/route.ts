// app/api/categories/[id]/subcategories/[subId]/route.ts
import { NextResponse } from 'next/server';
import { handleRemoveSubCategory, handleUpdateSubCategory } from '@/lib/category/category.controller';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; subId: string }> }
) {
    const { id, subId } = await params;
    const { status, body } = await handleRemoveSubCategory(id, subId);
    return NextResponse.json(body, { status });
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string; subId: string }> }
) {
    const { id, subId } = await params;
    const data = await req.json();
    const { status, body } = await handleUpdateSubCategory(id, subId, data);
    return NextResponse.json(body, { status });
}
