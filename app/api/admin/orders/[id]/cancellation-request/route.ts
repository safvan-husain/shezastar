import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { requireAdminAuth } from '@/lib/auth/admin-auth';
import { handleAdminReviewOrderCancellationRequest } from '@/lib/order/order.controller';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    try {
        await requireAdminAuth();
    } catch {
        return NextResponse.json(
            {
                code: 'UNAUTHORIZED',
                error: 'UNAUTHORIZED',
                message: 'Unauthorized',
            },
            { status: 401 },
        );
    }

    let payload: unknown = {};
    try {
        payload = await req.json();
    } catch {
        payload = {};
    }

    const { status, body } = await handleAdminReviewOrderCancellationRequest(id, payload);

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
}
