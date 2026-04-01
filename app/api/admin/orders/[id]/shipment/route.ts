import { NextResponse } from 'next/server';
import { handleCreateShipment, handleTrackShipment } from '@/lib/shipping/shipping.controller';
import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { buildAdminActivityActor } from '@/lib/activity/activity.service';
import { catchError } from '@/lib/errors/app-error';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function POSTHandler(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requireAdminApiAuth();
        const { id } = await params;

        let payload;
        try {
            payload = await req.json();
        } catch {
            payload = {};
        }

        const { status, body } = await handleCreateShipment(id, payload, buildAdminActivityActor(admin));
        return NextResponse.json(body, { status });
    } catch (error) {
        const handled = catchError(error);
        return NextResponse.json(handled.body, { status: handled.status });
    }
}

async function GETHandler(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireAdminApiAuth();
        const { id } = await params;
        const { status, body } = await handleTrackShipment(id);
        return NextResponse.json(body, { status });
    } catch (error) {
        const handled = catchError(error);
        return NextResponse.json(handled.body, { status: handled.status });
    }
}

export const POST = withRequestLogging(POSTHandler);
export const GET = withRequestLogging(GETHandler);
