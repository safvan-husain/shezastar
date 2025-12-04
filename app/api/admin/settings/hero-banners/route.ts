import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { handleGetHeroBanners, handleCreateHeroBanner } from '@/lib/app-settings/app-settings.controller';
import { saveImage } from '@/lib/utils/file-upload';

export async function GET() {
    const { status, body } = await handleGetHeroBanners();
    return NextResponse.json(body, { status });
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const imageFile = formData.get('image') as File | null;
        const imagePath = formData.get('imagePath') as string | null;

        let finalImagePath = imagePath;

        if (imageFile) {
            finalImagePath = await saveImage(imageFile);
        }

        const payload = {
            imagePath: finalImagePath,
            title: formData.get('title'),
            description: formData.get('description'),
            price: Number(formData.get('price')),
            offerPrice: Number(formData.get('offerPrice')),
            offerLabel: formData.get('offerLabel'),
        };

        const { status, body: result } = await handleCreateHeroBanner(payload);
        try {
            revalidatePath('/(admin)/settings/hero-banners', 'page');
        } catch (error) {
            // Ignore revalidation errors in test environment
        }
        return NextResponse.json(result, { status });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'An error occurred' }, { status: 500 });
    }
}
