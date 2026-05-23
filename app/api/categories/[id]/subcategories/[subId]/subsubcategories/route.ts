// app/api/categories/[id]/subcategories/[subId]/subsubcategories/route.ts
import { NextResponse } from 'next/server';
import { handleAddSubSubCategory } from '@/lib/category/category.controller';
import { withRequestLogging } from '@/lib/logging/request-logger';
import { revalidateCategoryCache } from '@/lib/category/category-cache';

async function POSTHandler(
    req: Request,
    { params }: { params: Promise<{ id: string; subId: string }> }
) {
    const { id, subId } = await params;
    const data = await req.json();
    const { status, body } = await handleAddSubSubCategory(id, subId, data);
    if (status < 400) {
        revalidateCategoryCache();
    }
    return NextResponse.json(body, { status });
}

export const POST = withRequestLogging(POSTHandler);
