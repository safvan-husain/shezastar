import { NextResponse } from 'next/server';
import { getBroaderCategoryContextIds } from '@/lib/category/category.service';
import { catchError } from '@/lib/errors/app-error';
import { getAllProducts, getProduct } from '@/lib/product/product.service';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function GETHandler(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const product = await getProduct(id);
        const broaderCategoryIds = await getBroaderCategoryContextIds(product.subCategoryIds);

        if (broaderCategoryIds.length === 0) {
            return NextResponse.json({ products: [] });
        }

        const result = await getAllProducts(1, 8, broaderCategoryIds, product.id);
        const products = (result.products ?? []).filter(relatedProduct => relatedProduct.id !== product.id);

        return NextResponse.json({ products });
    } catch (error) {
        const handled = catchError(error);
        return NextResponse.json(handled.body, { status: handled.status });
    }
}

export const GET = withRequestLogging(GETHandler);
