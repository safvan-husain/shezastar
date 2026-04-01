import { NextResponse } from 'next/server';
import { getCustomCards } from '@/lib/app-settings/app-settings.service';
import { AppError } from '@/lib/errors/app-error';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function GETHandler(_req: Request) {
    try {
        const cards = await getCustomCards();
        return NextResponse.json(cards);
    } catch (error) {
        if (error instanceof AppError) {
            return NextResponse.json(
                { message: error.message, code: error.code, details: error.details },
                { status: error.status}
            );
        }

        return NextResponse.json(
            { message: 'Failed to fetch custom cards', error: String(error) },
            { status: 500 }
        );
    }
}

export const GET = withRequestLogging(GETHandler);
