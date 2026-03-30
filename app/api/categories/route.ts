// app/api/categories/route.ts
import { NextResponse } from 'next/server';
import {
    handleGetAllCategories,
    handleCreateCategory,
} from '@/lib/category/category.controller';

function withNoStoreHeaders(headers?: HeadersInit) {
    return {
        'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
        Pragma: 'no-cache',
        ...headers,
    };
}

export async function GET() {
    const { status, body } = await handleGetAllCategories();
    return NextResponse.json(body, { status, headers: withNoStoreHeaders() });
}

export async function POST(req: Request) {
    const data = await req.json();
    const { status, body } = await handleCreateCategory(data);
    return NextResponse.json(body, { status });
}
