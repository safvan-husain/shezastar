// app/api/categories/route.ts
import { NextResponse } from 'next/server';
import {
    handleGetAllCategories,
    handleCreateCategory,
} from '@/lib/category/category.controller';

export async function GET() {
    const { status, body } = await handleGetAllCategories();
    return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
    const data = await req.json();
    const { status, body } = await handleCreateCategory(data);
    return NextResponse.json(body, { status });
}
