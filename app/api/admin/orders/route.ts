import { NextResponse } from 'next/server';
import { handleAdminListOrders } from '@/lib/order/order.controller';

export async function GET(req: Request) {
    const url = new URL(req.url);
    const pageParam = url.searchParams.get('page');
    const limitParam = url.searchParams.get('limit');
    const status = url.searchParams.get('status') || undefined;

    const page = pageParam ? Number(pageParam) : undefined;
    const limit = limitParam ? Number(limitParam) : undefined;

    const normalizedPage = typeof page === 'number' && !Number.isNaN(page) ? page : undefined;
    const normalizedLimit = typeof limit === 'number' && !Number.isNaN(limit) ? limit : undefined;

    const { status: httpStatus, body } = await handleAdminListOrders(
        normalizedPage,
        normalizedLimit,
        status,
    );

    return NextResponse.json(body, { status: httpStatus });
}

