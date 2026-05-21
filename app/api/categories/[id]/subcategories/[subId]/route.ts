// app/api/categories/[id]/subcategories/[subId]/route.ts
import { NextResponse } from 'next/server';
import { handleRemoveSubCategory, handleUpdateSubCategory } from '@/lib/category/category.controller';
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
    { params }: { params: Promise<{ id: string; subId: string }> }
) {
    const { id, subId } = await params;
    const { status, body } = await handleRemoveSubCategory(id, subId, { force: isForceDelete(req) });
    if (status < 400) {
        revalidateCategoryDeleteResult(body);
    }
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
