import { NextResponse } from 'next/server';

import {
    handleGetBillingDetailsForCurrentSession,
    handleSetBillingDetailsForCurrentSession,
} from '@/lib/cart/cart.controller';
import { withRequestLogging } from '@/lib/logging/request-logger';

type RouteParams = { params: Promise<Record<string, string>> };

async function GETHandler(req: Request, ctx: RouteParams) {
    await ctx.params;
    const { status, body } = await handleGetBillingDetailsForCurrentSession();
    return NextResponse.json(body, {
        status,
        headers: {
            'x-request-method': 'GET',
        },
    });
}

async function PUTHandler(req: Request, ctx: RouteParams) {
    await ctx.params;
    let payload: unknown = {};
    try {
        payload = await req.json();
    } catch {
        payload = {};
    }
    const { status, body } = await handleSetBillingDetailsForCurrentSession(payload);
    return NextResponse.json(body, {
        status,
        headers: {
            'x-request-method': 'PUT',
        },
    });
}

export const GET = withRequestLogging(GETHandler);
export const PUT = withRequestLogging(PUTHandler);
