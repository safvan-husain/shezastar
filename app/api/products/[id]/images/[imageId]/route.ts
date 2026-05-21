// app/api/products/[id]/images/[imageId]/route.ts
import { NextResponse } from 'next/server';
import { handleDeleteImage } from '@/lib/product/product.controller';
import { withRequestLogging } from '@/lib/logging/request-logger';
import { revalidateProductCache } from '@/lib/product/product-cache';

async function DELETEHandler(
    req: Request,
    { params }: { params: Promise<{ id: string; imageId: string }> }
) {
    const { id, imageId } = await params;
    const { status, body } = await handleDeleteImage(id, imageId);
    if (status < 400) {
        revalidateProductCache(id);
    }
    return NextResponse.json(body, { status });
}

export const DELETE = withRequestLogging(DELETEHandler);
