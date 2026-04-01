import { NextResponse } from 'next/server';
import { handleTrackProductView, handleGetRecentlyViewed } from '@/lib/product/recently-viewed.controller';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function GETHandler(_req: Request) {
    const { status, body } = await handleGetRecentlyViewed();
    return NextResponse.json(body, { status });
}

async function POSTHandler(req: Request) {
    let payload: unknown = {};
    try {
        payload = await req.json();
    } catch {
        payload = {};
    }
    const { status, body } = await handleTrackProductView(payload);
    return NextResponse.json(body, { status });
}

export const GET = withRequestLogging(GETHandler);
export const POST = withRequestLogging(POSTHandler);
