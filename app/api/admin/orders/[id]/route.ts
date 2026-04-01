import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
    handleAdminGetOrder,
    handleAdminUpdateOrderStatus,
} from '@/lib/order/order.controller';
import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { buildAdminActivityActor } from '@/lib/activity/activity.service';
import { catchError } from '@/lib/errors/app-error';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function GETHandler(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { status, body } = await handleAdminGetOrder(id);
    return NextResponse.json(body, { status });
}

async function PATCHHandler(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const admin = await requireAdminApiAuth();
        const { id } = await params;
        const payload = await req.json();
        const { status, body } = await handleAdminUpdateOrderStatus(id, payload, buildAdminActivityActor(admin));

        if (status >= 200 && status < 300) {
            try {
                revalidatePath('/manage/orders', 'page');
                revalidatePath(`/manage/orders/${id}`, 'page');
            } catch {
                // Ignore revalidation errors in test environment
            }
        }

        return NextResponse.json(body, { status });
    } catch (error) {
        const handled = catchError(error);
        return NextResponse.json(handled.body, { status: handled.status });
    }
}

export const GET = withRequestLogging(GETHandler);
export const PATCH = withRequestLogging(PATCHHandler);
