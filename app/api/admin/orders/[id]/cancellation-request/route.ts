import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { buildAdminActivityActor } from '@/lib/activity/activity.service';
import { handleAdminReviewOrderCancellationRequest } from '@/lib/order/order.controller';
import { catchError } from '@/lib/errors/app-error';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requireAdminApiAuth();
        const { id } = await params;

        let payload: unknown = {};
        try {
            payload = await req.json();
        } catch {
            payload = {};
        }

        const { status, body } = await handleAdminReviewOrderCancellationRequest(
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
