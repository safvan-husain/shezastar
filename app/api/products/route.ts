// app/api/products/route.ts
import { NextResponse } from 'next/server';
import {
    handleGetAllProducts,
    handleCreateProduct,
} from '@/lib/product/product.controller';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const { status, body } = await handleGetAllProducts(page, limit);
    return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
    const data = await req.json();
    const { status, body } = await handleCreateProduct(data);
    return NextResponse.json(body, { status });
}
