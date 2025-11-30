// app/api/categories/[id]/subcategories/[subId]/subsubcategories/[subSubId]/route.ts
import { NextResponse } from 'next/server';
import { handleRemoveSubSubCategory } from '@/lib/category/category.controller';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; subId: string; subSubId: string }> }
) {
    const { id, subId, subSubId } = await params;
    const { status, body } = await handleRemoveSubSubCategory(id, subId, subSubId);
    return NextResponse.json(body, { status });
}
