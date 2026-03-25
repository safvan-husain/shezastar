import { NextResponse } from 'next/server';
import { handleShipmentWeightCheck } from '@/lib/shipping/shipping.controller';

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { status, body } = await handleShipmentWeightCheck(id);
    return NextResponse.json(body, { status });
}
