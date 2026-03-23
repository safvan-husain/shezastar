import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { getStorefrontSession } from '@/lib/storefront-session';
import { handleRequestOrderCancellationByCustomer } from '@/lib/order/order.controller';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await getStorefrontSession();

    if (!session) {
        return NextResponse.json(
            {
                code: 'UNAUTHENTICATED',
                error: 'UNAUTHENTICATED',
                message: 'No active storefront session',
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

    const { status, body } = await handleRequestOrderCancellationByCustomer(
        id,
        payload,
        {
            sessionId: session.sessionId,
            userId: session.userId,
        },
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
}
