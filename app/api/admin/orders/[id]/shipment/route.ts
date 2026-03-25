import { NextResponse } from 'next/server';
import { handleCreateShipment, handleTrackShipment } from '@/lib/shipping/shipping.controller';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    let payload;
    try {
        payload = await req.json();
    } catch {
        payload = {};
    }
    
    const { status, body } = await handleCreateShipment(id, payload);
    return NextResponse.json(body, { status });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { status, body } = await handleTrackShipment(id);
    return NextResponse.json(body, { status });
}
