import { NextResponse, connection } from 'next/server';
import { handleTrackProductView, handleGetRecentlyViewed } from '@/lib/product/recently-viewed.controller';



export async function GET() {
    await connection();
    const { status, body } = await handleGetRecentlyViewed();
    return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
    let payload: unknown = {};
    try {
        payload = await req.json();
    } catch {
        payload = {};
    }
    const { status, body } = await handleTrackProductView(payload);
    return NextResponse.json(body, { status });
}
