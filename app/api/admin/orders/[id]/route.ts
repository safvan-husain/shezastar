import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
    handleAdminGetOrder,
    handleAdminUpdateOrderStatus,
} from '@/lib/order/order.controller';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { status, body } = await handleAdminGetOrder(id);
    return NextResponse.json(body, { status });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const payload = await req.json();
    const { status, body } = await handleAdminUpdateOrderStatus(id, payload);

    if (status >= 200 && status < 300) {
        try {
            revalidatePath('/(admin)/manage-orders', 'page');
            revalidatePath(`/(admin)/manage-orders/${id}`, 'page');
        } catch {
            // Ignore revalidation errors in test environment
        }
    }

    return NextResponse.json(body, { status });
}
