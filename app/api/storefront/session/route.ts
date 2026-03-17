import { NextResponse } from 'next/server';

import {
    handleEnsureStorefrontSession,
    handleGetStorefrontSession,
    handleRevokeStorefrontSession,
} from '@/lib/storefront-session/storefront-session.controller';

type RouteContext = { params: Promise<Record<string, string>> };

async function readBody(req: Request): Promise<unknown> {
    try {
        return await req.json();
    } catch {
        return undefined;
    }
}

export async function GET(_req: Request, ctx: RouteContext) {
    await ctx.params;
    const { status, body } = await handleGetStorefrontSession();
    return NextResponse.json(body, { status });
}

export async function POST(req: Request, ctx: RouteContext) {
    await ctx.params;
    const payload = await readBody(req);
    const { status, body } = await handleEnsureStorefrontSession(payload);
    return NextResponse.json(body, { status });
}

export async function DELETE(_req: Request, ctx: RouteContext) {
    await ctx.params;
    const { status, body } = await handleRevokeStorefrontSession();
    return NextResponse.json(body, { status });
}
