import { NextResponse } from 'next/server';

import {
    handleEnsureStorefrontSession,
    handleGetStorefrontSession,
    handleRevokeStorefrontSession,
} from '@/lib/storefront-session/storefront-session.controller';
import { withRequestLogging } from '@/lib/logging/request-logger';

type RouteContext = { params: Promise<Record<string, string>> };

async function readBody(req: Request): Promise<unknown> {
    try {
        return await req.json();
    } catch {
        return undefined;
    }
}

async function GETHandler(_req: Request, ctx: RouteContext) {
    await ctx.params;
    const { status, body } = await handleGetStorefrontSession();
    return NextResponse.json(body, { status });
}

async function POSTHandler(req: Request, ctx: RouteContext) {
    await ctx.params;
    const payload = await readBody(req);
    const { status, body } = await handleEnsureStorefrontSession(payload);
    return NextResponse.json(body, { status });
}

async function DELETEHandler(_req: Request, ctx: RouteContext) {
    await ctx.params;
    const { status, body } = await handleRevokeStorefrontSession();
    return NextResponse.json(body, { status });
}

export const GET = withRequestLogging(GETHandler);
export const POST = withRequestLogging(POSTHandler);
export const DELETE = withRequestLogging(DELETEHandler);
