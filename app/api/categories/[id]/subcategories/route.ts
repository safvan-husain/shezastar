// app/api/categories/[id]/subcategories/route.ts
import { NextResponse } from 'next/server';
import { handleAddSubCategory } from '@/lib/category/category.controller';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const data = await req.json();
    const { status, body } = await handleAddSubCategory(id, data);
    return NextResponse.json(body, { status });
}
