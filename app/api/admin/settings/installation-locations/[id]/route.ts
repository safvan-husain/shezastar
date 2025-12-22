import { NextRequest, NextResponse } from 'next/server';
import { updateInstallationLocation, removeInstallationLocation } from '@/lib/app-settings/app-settings.service';
import { InstallationLocationSchema } from '@/lib/app-settings/app-settings.schema';
import { AppError } from '@/lib/errors/app-error';

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await req.json();
        const validated = InstallationLocationSchema.omit({ id: true }).parse(body);

        const settings = await updateInstallationLocation(id, validated);
        return NextResponse.json(settings);
    } catch (error) {
        console.error('Failed to update installation location:', error);

        if (error instanceof AppError) {
            return NextResponse.json(
                { error: error.message, details: error.details },
                { status: error.status }
            );
        }

        // Zod error
        if (error && typeof error === 'object' && 'issues' in error) {
            return NextResponse.json(
                { message: 'Validation failed', errors: error },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to update installation location' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const settings = await removeInstallationLocation(id);
        return NextResponse.json(settings);
    } catch (error) {
        console.error('Failed to remove installation location:', error);

        if (error instanceof AppError) {
            return NextResponse.json(
                { error: error.message, details: error.details },
                { status: error.status }
            );
        }

        return NextResponse.json(
            { error: 'Failed to remove installation location' },
            { status: 500 }
        );
    }
}
