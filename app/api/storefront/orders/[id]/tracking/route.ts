import { NextResponse } from 'next/server';
import { handleTrackShipment } from '@/lib/shipping/shipping.controller';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { status, body } = await handleTrackShipment(id);

    return NextResponse.json(body, { status });
}
