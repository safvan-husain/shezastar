// app/api/products/[id]/images/[imageId]/route.ts
import { NextResponse } from 'next/server';
import { handleDeleteImage } from '@/lib/product/product.controller';

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string; imageId: string }> }
) {
    const { id, imageId } = await params;
    const { status, body } = await handleDeleteImage(id, imageId);
    return NextResponse.json(body, { status });
}
