import { NextResponse } from 'next/server';
import { handleShipmentWeightCheck } from '@/lib/shipping/shipping.controller';
import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { catchError } from '@/lib/errors/app-error';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function GETHandler(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireAdminApiAuth();
        const { id } = await params;
        const { status, body } = await handleShipmentWeightCheck(id);
        return NextResponse.json(body, { status });
    } catch (error) {
        const handled = catchError(error);
        return NextResponse.json(handled.body, { status: handled.status });
    }
}

export const GET = withRequestLogging(GETHandler);
