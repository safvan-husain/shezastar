import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { handleGetFeaturedProducts, handleAddFeaturedProduct } from '@/lib/app-settings/app-settings.controller';

export async function GET() {
    const { status, body } = await handleGetFeaturedProducts();
    return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
    const body = await req.json();
    const { status, body: result } = await handleAddFeaturedProduct(body);
    try {
        revalidatePath('/manage/settings/featured-products', 'page');
    } catch (error) {
        // Ignore revalidation errors in test environment
    }
    return NextResponse.json(result, { status });
}
