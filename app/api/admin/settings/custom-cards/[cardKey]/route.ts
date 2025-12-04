import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
    handleGetCustomCard,
    handleCreateCustomCard,
    handleUpdateCustomCard,
    handleDeleteCustomCard
} from '@/lib/app-settings/app-settings.controller';
import { saveImage, deleteImage } from '@/lib/utils/file-upload';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ cardKey: string }> }
) {
    const { cardKey } = await params;
    const result = await handleGetCustomCard(cardKey);
    return NextResponse.json(result.body, { status: result.status });
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ cardKey: string }> }
) {
    const { cardKey } = await params;
    try {
        const formData = await request.formData();
        const imageFile = formData.get('image') as File | null;
        const imagePath = formData.get('imagePath') as string | null;

        let finalImagePath = imagePath;

        if (imageFile) {
            finalImagePath = await saveImage(imageFile);
        }

        const payload = {
            title: formData.get('title'),
            subtitle: formData.get('subtitle'),
            imagePath: finalImagePath,
            offerLabel: formData.get('offerLabel'),
            urlLink: formData.get('urlLink'),
        };

        const result = await handleCreateCustomCard(cardKey, payload);
        try {
            revalidatePath('/', 'layout');
        } catch (error) {
            // Ignore revalidation errors
        }
        return NextResponse.json(result.body, { status: result.status });
    } catch (error) {
        console.error('[custom-cards POST]', error);
        const status =
            typeof (error as { status?: number }).status === 'number'
                ? (error as { status: number }).status
                : 500;
        const errorBody =
            (error as { body?: unknown }).body ??
            (error instanceof Error ? { message: error.message } : { message: 'Unexpected error' });
        return NextResponse.json(errorBody, { status });
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ cardKey: string }> }
) {
    const { cardKey } = await params;
    try {
        const formData = await request.formData();
        const imageFile = formData.get('image') as File | null;
        const imagePath = formData.get('imagePath') as string | null;

        let finalImagePath = imagePath;

        if (imageFile) {
            // Get existing card to delete old image
            const existingCardResult = await handleGetCustomCard(cardKey);
            const existingCard = existingCardResult.body;

            if (existingCard && existingCard.imagePath) {
                await deleteImage(existingCard.imagePath);
            }

            finalImagePath = await saveImage(imageFile);
        }

        const payload = {
            title: formData.get('title'),
            subtitle: formData.get('subtitle'),
            imagePath: finalImagePath,
            offerLabel: formData.get('offerLabel'),
            urlLink: formData.get('urlLink'),
        };

        const result = await handleUpdateCustomCard(cardKey, payload);
        try {
            revalidatePath('/', 'layout');
        } catch (error) {
            // Ignore revalidation errors
        }
        return NextResponse.json(result.body, { status: result.status });
    } catch (error) {
        console.error('[custom-cards PUT]', error);
        const status =
            typeof (error as { status?: number }).status === 'number'
                ? (error as { status: number }).status
                : 500;
        const errorBody =
            (error as { body?: unknown }).body ??
            (error instanceof Error ? { message: error.message } : { message: 'Unexpected error' });
        return NextResponse.json(errorBody, { status });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ cardKey: string }> }
) {
    const { cardKey } = await params;
    try {
        // Get existing card to delete image
        const existingCardResult = await handleGetCustomCard(cardKey);
        const existingCard = existingCardResult.body;

        if (existingCard && existingCard.imagePath) {
            await deleteImage(existingCard.imagePath);
        }

        const result = await handleDeleteCustomCard(cardKey);
        try {
            revalidatePath('/', 'layout');
        } catch (error) {
            // Ignore revalidation errors
        }
        return NextResponse.json(result.body, { status: result.status });
    } catch (error) {
        console.error('[custom-cards DELETE]', error);
        const status =
            typeof (error as { status?: number }).status === 'number'
                ? (error as { status: number }).status
                : 500;
        const errorBody =
            (error as { body?: unknown }).body ??
            (error instanceof Error ? { message: error.message } : { message: 'Unexpected error' });
        return NextResponse.json(errorBody, { status });
    }
}
