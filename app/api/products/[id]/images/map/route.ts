// app/api/products/[id]/images/map/route.ts
import { NextResponse } from 'next/server';
import { handleMapImages } from '@/lib/product/product.controller';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function POSTHandler(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const data = await req.json();
    const { status, body } = await handleMapImages(id, data);
    return NextResponse.json(body, { status });
}

export const POST = withRequestLogging(POSTHandler);
