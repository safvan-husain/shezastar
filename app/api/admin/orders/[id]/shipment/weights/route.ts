import { NextResponse } from 'next/server';
import { handleUpdateShipmentWeights } from '@/lib/shipping/shipping.controller';
import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { catchError } from '@/lib/errors/app-error';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function PATCHHandler(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireAdminApiAuth();
        const { id } = await params;

        let payload: unknown = {};
        try {
            payload = await req.json();
        } catch {
            payload = {};
        }

        const { status, body } = await handleUpdateShipmentWeights(id, payload);
        return NextResponse.json(body, { status });
    } catch (error) {
        const handled = catchError(error);
        return NextResponse.json(handled.body, { status: handled.status });
    }
}

export const PATCH = withRequestLogging(PATCHHandler);
