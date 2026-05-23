import { NextResponse } from 'next/server';
import { bulkUpdatePrices } from '@/lib/product/product.service';
import { BulkPriceUpdateSchema } from '@/lib/product/product.schema';
import { AppError } from '@/lib/errors/app-error';
import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { SUPER_ADMIN_ROLES } from '@/lib/auth/admin-permissions';
import { buildAdminActivityActor } from '@/lib/activity/activity.service';
import { withRequestLogging } from '@/lib/logging/request-logger';
import { revalidateProductCache } from '@/lib/product/product-cache';

async function POSTHandler(req: Request) {
    try {
        const admin = await requireAdminApiAuth({ roles: [...SUPER_ADMIN_ROLES] });
        const body = await req.json();
        const parsed = BulkPriceUpdateSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: parsed.error.flatten() },
                { status: 400 }
            );
        }

        const result = await bulkUpdatePrices(parsed.data, buildAdminActivityActor(admin));
        revalidateProductCache();
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

export const POST = withRequestLogging(POSTHandler);
