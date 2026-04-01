// app/api/variant-types/route.ts
import { NextResponse } from 'next/server';
import {
    handleGetAllVariantTypes,
    handleCreateVariantType,
} from '@/lib/variant-type/variant-type.controller';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function GETHandler(_req: Request) {
    const { status, body } = await handleGetAllVariantTypes();
    return NextResponse.json(body, { status });
}

async function POSTHandler(req: Request) {
    const data = await req.json();
    const { status, body } = await handleCreateVariantType(data);
    return NextResponse.json(body, { status });
}

export const GET = withRequestLogging(GETHandler);
export const POST = withRequestLogging(POSTHandler);
