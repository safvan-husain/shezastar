import { NextResponse } from 'next/server';
import { bulkUpdatePrices } from '@/lib/product/product.service';
import { BulkPriceUpdateSchema } from '@/lib/product/product.schema';
import { AppError } from '@/lib/errors/app-error';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = BulkPriceUpdateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const result = await bulkUpdatePrices(parsed.data);
        return NextResponse.json(result);
    } catch (error) {
        if (error instanceof AppError) {
            return NextResponse.json(
                { error: error.code, message: error.details?.message },
                { status: error.status }
            );
        }
        console.error('Bulk price update error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
