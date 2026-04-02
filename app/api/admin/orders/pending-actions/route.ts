import { NextResponse } from 'next/server';
import { handleAdminListOrderPendingActions } from '@/lib/order/order.controller';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function GETHandler() {
    const { status, body } = await handleAdminListOrderPendingActions();
    return NextResponse.json(body, { status });
}

export const GET = withRequestLogging(GETHandler);
