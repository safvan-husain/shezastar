import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { handleGetHeroBanners, handleCreateHeroBanner } from '@/lib/app-settings/app-settings.controller';
import { saveImage } from '@/lib/utils/file-upload';
import { requireAdminAuth } from '@/lib/auth/admin-auth';

export async function GET() {
    try {
        //this is used by storefron tooo, so no auth required
        const { status, body } = await handleGetHeroBanners();
        return NextResponse.json(body, { status });
    } catch (error: any) {
        if (error.digest?.includes('NEXT_REDIRECT')) throw error;
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
}

export async function POST(req: Request) {
    try {
        await requireAdminAuth();

        const formData = await req.formData();
        const imageFile = formData.get('image') as File | null;
        const imagePath = formData.get('imagePath') as string | null;

        let finalImagePath = imagePath || '';

        if (imageFile && imageFile.size > 0) {
            finalImagePath = await saveImage(imageFile);
        }

        const payload = {
            imagePath: finalImagePath,
            title: formData.get('title') as string,
            description: formData.get('description') as string,
            price: Number(formData.get('price')),
            offerPrice: Number(formData.get('offerPrice')),
            offerLabel: formData.get('offerLabel') as string,
        };

        const { status, body: result } = await handleCreateHeroBanner(payload);

        try {
            revalidatePath('/manage/settings/hero-banners', 'page');
        } catch (error) {
            // Ignore revalidation errors
        }

        return NextResponse.json(result, { status });
    } catch (error: any) {
        if (error.digest?.includes('NEXT_REDIRECT')) throw error;
        console.error('API Error [hero-banners POST]:', error);
        return NextResponse.json(
            { message: error.message || 'An error occurred while creating the banner' },
            { status: error.status || 500 }
        );
    }
}
