// app/api/categories/[id]/route.ts
import { NextResponse } from 'next/server';
import {
    handleGetCategory,
    handleUpdateCategory,
    handleDeleteCategory,
} from '@/lib/category/category.controller';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { status, body } = await handleGetCategory(id);
    return NextResponse.json(body, { status });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await req.json();
    const { status, body } = await handleUpdateCategory(id, data);
    return NextResponse.json(body, { status });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { status, body } = await handleDeleteCategory(id);
    return NextResponse.json(body, { status });
}
