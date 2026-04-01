// app/api/variant-types/[id]/route.ts
import { NextResponse } from 'next/server';
import {
    handleGetVariantType,
    handleUpdateVariantType,
    handleDeleteVariantType,
} from '@/lib/variant-type/variant-type.controller';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function GETHandler(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { status, body } = await handleGetVariantType(id);
    return NextResponse.json(body, { status });
}

async function PUTHandler(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const data = await req.json();
    const { status, body } = await handleUpdateVariantType(id, data);
    return NextResponse.json(body, { status });
}

async function DELETEHandler(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { status, body } = await handleDeleteVariantType(id);
    return NextResponse.json(body, { status });
}

export const GET = withRequestLogging(GETHandler);
export const PUT = withRequestLogging(PUTHandler);
export const DELETE = withRequestLogging(DELETEHandler);
