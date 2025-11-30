// app/api/categories/[id]/subcategories/[subId]/subsubcategories/route.ts
import { NextResponse } from 'next/server';
import { handleAddSubSubCategory } from '@/lib/category/category.controller';

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string; subId: string }> }
) {
    const { id, subId } = await params;
    const data = await req.json();
    const { status, body } = await handleAddSubSubCategory(id, subId, data);
    return NextResponse.json(body, { status });
}
