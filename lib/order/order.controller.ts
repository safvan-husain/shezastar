import { catchError } from '@/lib/errors/app-error';
import type { OrderStatus } from './model/order.model';
import {
    listOrders,
    getOrderById,
    updateOrderStatusById,
    requestOrderCancellationByCustomer,
    reviewOrderCancellationByAdmin,
    type OrderCancellationActor,
} from './order.service';
import { 
    UpdateOrderStatusSchema, 
    RequestOrderCancellationSchema, 
    ReviewOrderCancellationSchema 
} from './order.schema';

const VALID_STATUSES: OrderStatus[] = ['pending', 'paid', 'cancelled', 'failed', 'completed'];

export async function handleAdminListOrders(
    page?: number,
    limit?: number,
    status?: string,
) {
    try {
        let normalizedStatus: OrderStatus | undefined;

        if (status) {
            if (!VALID_STATUSES.includes(status as OrderStatus)) {
                throw new Error(`INVALID_STATUS:${status}`);
            }
            normalizedStatus = status as OrderStatus;
        }

        const result = await listOrders({
            page,
            limit,
            status: normalizedStatus,
        });

        return { status: 200, body: result };
    } catch (err) {
        if (err instanceof Error && err.message.startsWith('INVALID_STATUS:')) {
            const invalidStatus = err.message.split(':')[1];
            return {
                status: 400,
                body: {
                    code: 'INVALID_STATUS',
                    error: 'INVALID_STATUS',
                    details: { status: invalidStatus },
                },
            };
        }

        return catchError(err);
    }
}

export async function handleAdminGetOrder(id: string) {
    try {
        const result = await getOrderById(id);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleAdminUpdateOrderStatus(id: string, input: unknown) {
    try {
        const parsed = UpdateOrderStatusSchema.parse(input);
        const result = await updateOrderStatusById(id, parsed.status);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleRequestOrderCancellationByCustomer(
    id: string,
    input: unknown,
    actor: OrderCancellationActor,
) {
    try {
        const parsed = RequestOrderCancellationSchema.parse(input);
        const result = await requestOrderCancellationByCustomer(id, actor, parsed.reason);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleAdminReviewOrderCancellationRequest(id: string, input: unknown) {
    try {
        const parsed = ReviewOrderCancellationSchema.parse(input);
        const result = await reviewOrderCancellationByAdmin(id, parsed);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}
