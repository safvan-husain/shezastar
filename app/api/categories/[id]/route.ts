// app/api/categories/[id]/route.ts
import { NextResponse } from 'next/server';
import {
    handleGetCategory,
    handleUpdateCategory,
    handleDeleteCategory,
} from '@/lib/category/category.controller';
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

async function GETHandler(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { status, body } = await handleGetCategory(id);
    return NextResponse.json(body, { status });
}

async function PUTHandler(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await req.json();
    const { status, body } = await handleUpdateCategory(id, data);
    if (status < 400) {
        revalidateCategoryCache();
    }
    return NextResponse.json(body, { status });
}

async function DELETEHandler(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { status, body } = await handleDeleteCategory(id, { force: isForceDelete(req) });
    if (status < 400) {
        revalidateCategoryDeleteResult(body);
    }
    return NextResponse.json(body, { status });
}

export const GET = withRequestLogging(GETHandler);
export const PUT = withRequestLogging(PUTHandler);
export const DELETE = withRequestLogging(DELETEHandler);
