
import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '@/lib/product/product.service';
import { AppError } from '@/lib/errors/app-error';
import { withRequestLogging } from '@/lib/logging/request-logger';

export const dynamic = 'force-dynamic';

async function GETHandler(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('q');
        const limitParam = searchParams.get('limit');

        if (!query) {
            return NextResponse.json({ products: [] });
        }

        const limit = limitParam ? parseInt(limitParam, 10) : 10;
        const products = await searchProducts(query, limit);

        return NextResponse.json({ products });
    } catch (error) {
        if (error instanceof AppError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.status }
            );
        }

        console.error('Search API Error:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export const GET = withRequestLogging(GETHandler);
