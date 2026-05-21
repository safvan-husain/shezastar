// app/api/categories/[id]/subcategories/[subId]/subsubcategories/[subSubId]/route.ts
import { NextResponse } from 'next/server';
import { handleRemoveSubSubCategory } from '@/lib/category/category.controller';
import { withRequestLogging } from '@/lib/logging/request-logger';
import { revalidateCategoryCache } from '@/lib/category/category-cache';
import { revalidateProductCache } from '@/lib/product/product-cache';

function isForceDelete(req: Request) {
    return new URL(req.url).searchParams.get('force') === 'true';
}

function revalidateCategoryDeleteResult(body: unknown) {
    revalidateCategoryCache();

    if (!body || typeof body !== 'object' || !('cleanedProductIds' in body) || !Array.isArray(body.cleanedProductIds)) {
        return;
    }

    body.cleanedProductIds.forEach(productId => {
        if (typeof productId === 'string') {
            revalidateProductCache(productId);
        }
    });
}

async function DELETEHandler(
    req: Request,
    { params }: { params: Promise<{ id: string; subId: string; subSubId: string }> }
) {
    const { id, subId, subSubId } = await params;
    const { status, body } = await handleRemoveSubSubCategory(id, subId, subSubId, { force: isForceDelete(req) });
    if (status < 400) {
        revalidateCategoryDeleteResult(body);
    }
    return NextResponse.json(body, { status });
}

export const DELETE = withRequestLogging(DELETEHandler);
