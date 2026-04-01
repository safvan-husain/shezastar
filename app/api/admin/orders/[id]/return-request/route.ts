import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { buildAdminActivityActor } from '@/lib/activity/activity.service';
import { handleAdminReviewOrderReturnRequest } from '@/lib/order/order.controller';
import { catchError } from '@/lib/errors/app-error';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function PATCHHandler(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requireAdminApiAuth();
        const { id } = await params;

        let payload: unknown = {};
        try {
            payload = await req.json();
        } catch {
            payload = {};
        }

        const { status, body } = await handleAdminReviewOrderReturnRequest(
            id,
            payload,
            buildAdminActivityActor(admin),
        );

        if (status >= 200 && status < 300) {
            try {
                revalidatePath('/(store)/orders', 'page');
                revalidatePath('/manage/orders', 'page');
                revalidatePath(`/manage/orders/${id}`, 'page');
            } catch {
                // Ignore revalidation errors in test environments.
            }
        }

        return NextResponse.json(body, { status });
    } catch (error) {
        const handled = catchError(error);
        return NextResponse.json(handled.body, { status: handled.status });
    }
}

export const PATCH = withRequestLogging(PATCHHandler);
