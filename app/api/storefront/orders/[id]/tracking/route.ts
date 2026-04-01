import { NextResponse } from 'next/server';
import { handleTrackShipment } from '@/lib/shipping/shipping.controller';
import { getStorefrontSession } from '@/lib/storefront-session';
import { getOrderById } from '@/lib/order/order.service';
import { catchError, AppError } from '@/lib/errors/app-error';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function GETHandler(_req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const session = await getStorefrontSession();
        if (!session) {
            throw new AppError(401, 'UNAUTHENTICATED', { message: 'No active storefront session.' });
        }

        const order = await getOrderById(id);
        const hasAccess = order.userId
            ? Boolean(session.userId && session.userId === order.userId)
            : order.sessionId === session.sessionId;

        if (!hasAccess) {
            throw new AppError(403, 'ORDER_ACCESS_DENIED', { id });
        }

        const { status, body } = await handleTrackShipment(id);
        return NextResponse.json(body, { status });
    } catch (err) {
        const { status, body } = catchError(err);
        return NextResponse.json(body, { status });
    }
}

export const GET = withRequestLogging(GETHandler);
