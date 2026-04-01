import { NextRequest, NextResponse } from 'next/server';
import { getInstallationLocations, addInstallationLocation } from '@/lib/app-settings/app-settings.service';
import { InstallationLocationSchema } from '@/lib/app-settings/app-settings.schema';
import { AppError } from '@/lib/errors/app-error';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function GETHandler(_req: Request) {
    try {
        const locations = await getInstallationLocations();
        return NextResponse.json(locations);
    } catch (error) {
        console.error('Failed to fetching installation locations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch installation locations' },
            { status: 500 }
        );
    }
}

async function POSTHandler(req: NextRequest) {
    try {
        const body = await req.json();
        const validated = InstallationLocationSchema.omit({ id: true }).parse(body);

        const settings = await addInstallationLocation(validated);
        return NextResponse.json(settings);
    } catch (error) {
        console.error('Failed to add installation location:', error);

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
            { error: 'Failed to add installation location' },
            { status: 500 }
        );
    }
}

export const GET = withRequestLogging(GETHandler);
export const POST = withRequestLogging(POSTHandler);
