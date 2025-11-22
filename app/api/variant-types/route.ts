// app/api/variant-types/route.ts
import { NextResponse } from 'next/server';
import {
    handleGetAllVariantTypes,
    handleCreateVariantType,
} from '@/lib/variant-type/variant-type.controller';

export async function GET() {
    const { status, body } = await handleGetAllVariantTypes();
    return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
    const data = await req.json();
    const { status, body } = await handleCreateVariantType(data);
    return NextResponse.json(body, { status });
}
