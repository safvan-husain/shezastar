import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
    handleGetCustomCard,
    handleCreateCustomCard,
    handleUpdateCustomCard,
    handleDeleteCustomCard
} from '@/lib/app-settings/app-settings.controller';

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
    const body = await request.json();
    const result = await handleCreateCustomCard(cardKey, body);
    try {
        revalidatePath('/', 'layout');
    } catch (error) {
        // Ignore revalidation errors
    }
    return NextResponse.json(result.body, { status: result.status });
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ cardKey: string }> }
) {
    const { cardKey } = await params;
    const body = await request.json();
    const result = await handleUpdateCustomCard(cardKey, body);
    try {
        revalidatePath('/', 'layout');
    } catch (error) {
        // Ignore revalidation errors
    }
    return NextResponse.json(result.body, { status: result.status });
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ cardKey: string }> }
) {
    const { cardKey } = await params;
    const result = await handleDeleteCustomCard(cardKey);
    try {
        revalidatePath('/', 'layout');
    } catch (error) {
        // Ignore revalidation errors
    }
    return NextResponse.json(result.body, { status: result.status });
}
