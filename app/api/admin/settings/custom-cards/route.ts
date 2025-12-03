import { NextResponse } from 'next/server';
import { getCustomCards } from '@/lib/app-settings/app-settings.service';
import { AppError } from '@/lib/errors/app-error';

export async function GET() {
    try {
        const cards = await getCustomCards();
        return NextResponse.json(cards);
    } catch (error) {
        if (error instanceof AppError) {
            return NextResponse.json(
                { message: error.message, code: error.code, details: error.details },
                { status: error.statusCode }
            );
        }

        return NextResponse.json(
            { message: 'Failed to fetch custom cards', error: String(error) },
            { status: 500 }
        );
    }
}
