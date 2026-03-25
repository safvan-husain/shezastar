import { NextResponse } from 'next/server';
import { handleUpdateShipmentWeights } from '@/lib/shipping/shipping.controller';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    let payload: unknown = {};
    try {
        payload = await req.json();
    } catch {
        payload = {};
    }

    const { status, body } = await handleUpdateShipmentWeights(id, payload);
    return NextResponse.json(body, { status });
}
