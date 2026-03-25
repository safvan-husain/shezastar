import { NextResponse } from 'next/server';
import { handleGetShipmentLabel } from '@/lib/shipping/shipping.controller';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const result = await handleGetShipmentLabel(id);

    if (result.status !== 200 || !result.body) {
        return NextResponse.json(result.body, { status: result.status });
    }

    // Return the PDF buffer directly
    return new NextResponse(result.body, {
        status: 200,
        headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="label-${id}.pdf"`,
        },
    });
}
