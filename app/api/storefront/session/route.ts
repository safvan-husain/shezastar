import { NextResponse } from 'next/server';

import {
    handleEnsureStorefrontSession,
    handleGetStorefrontSession,
    handleRevokeStorefrontSession,
} from '@/lib/storefront-session/storefront-session.controller';

type RouteParams = { params: Promise<Record<string, string>> };

export async function GET(req: Request, ctx: RouteParams) {
    await ctx.params;
    const { status, body } = await handleGetStorefrontSession();
    return NextResponse.json(body, { status });
}

export async function POST(req: Request, ctx: RouteParams) {
    await ctx.params;
    let payload: unknown = {};
    try {
        const parsed = await req.json();
        payload = parsed ?? {};
    } catch {
        payload = {};
    }
    const { status, body } = await handleEnsureStorefrontSession(payload);
    return NextResponse.json(body, { status });
}

export async function DELETE(req: Request, ctx: RouteParams) {
    await ctx.params;
    const { status, body } = await handleRevokeStorefrontSession();
    return NextResponse.json(body, { status });
}
