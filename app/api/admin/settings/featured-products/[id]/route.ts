import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { handleRemoveFeaturedProduct } from '@/lib/app-settings/app-settings.controller';

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { status, body: result } = await handleRemoveFeaturedProduct(id);
    try {
        revalidatePath('/manage/settings/featured-products', 'page');
    } catch (error) {
        // Ignore revalidation errors in test environment
    }
    return NextResponse.json(result, { status });
}
