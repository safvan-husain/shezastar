// app/api/categories/route.ts
import { NextResponse } from 'next/server';
import {
    handleGetAllCategories,
    handleCreateCategory,
} from '@/lib/category/category.controller';
import { withRequestLogging } from '@/lib/logging/request-logger';

function withNoStoreHeaders(headers?: HeadersInit) {
    return {
        'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
        Pragma: 'no-cache',
        ...headers,
    };
}

async function GETHandler(_req: Request) {
    const { status, body } = await handleGetAllCategories();
    return NextResponse.json(body, { status, headers: withNoStoreHeaders() });
}

async function POSTHandler(req: Request) {
    const data = await req.json();
    const { status, body } = await handleCreateCategory(data);
    return NextResponse.json(body, { status });
}

export const GET = withRequestLogging(GETHandler);
export const POST = withRequestLogging(POSTHandler);
