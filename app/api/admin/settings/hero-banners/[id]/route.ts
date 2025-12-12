import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { handleUpdateHeroBanner, handleDeleteHeroBanner, handleGetHeroBanners } from '@/lib/app-settings/app-settings.controller';
import { saveImage, deleteImage } from '@/lib/utils/file-upload';
import { HeroBannerWithId } from '@/lib/app-settings/app-settings.schema';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        const formData = await req.formData();
        const imageFile = formData.get('image') as File | null;
        const imagePath = formData.get('imagePath') as string | null;

        let finalImagePath = imagePath;

        if (imageFile) {
            // Get existing banner to delete old image
            const { body: banners } = await handleGetHeroBanners();
            const existingBanner = (banners as HeroBannerWithId[]).find(b => b.id === id);

            if (existingBanner && existingBanner.imagePath) {
                await deleteImage(existingBanner.imagePath);
            }

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

        const { status, body: result } = await handleUpdateHeroBanner(id, payload);
        try {
            revalidatePath('/manage/settings/hero-banners', 'page');
        } catch (error) {
            // Ignore revalidation errors in test environment
        }
        return NextResponse.json(result, { status });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'An error occurred' }, { status: 500 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    try {
        // Get existing banner to delete image
        const { body: banners } = await handleGetHeroBanners();
        const existingBanner = (banners as HeroBannerWithId[]).find(b => b.id === id);

        if (existingBanner && existingBanner.imagePath) {
            await deleteImage(existingBanner.imagePath);
        }

        const { status, body: result } = await handleDeleteHeroBanner(id);
        try {
            revalidatePath('/manage/settings/hero-banners', 'page');
        } catch (error) {
            // Ignore revalidation errors in test environment
        }
        return NextResponse.json(result, { status });
    } catch (error: any) {
        return NextResponse.json({ message: error.message || 'An error occurred' }, { status: 500 });
    }
}
