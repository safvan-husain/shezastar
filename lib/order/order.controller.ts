import { catchError } from '@/lib/errors/app-error';
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

export async function handleAdminListOrders(
    page?: number,
    limit?: number,
    status?: string,
) {
    try {
        const result = await listOrders({
            page,
            limit,
            status: status?.trim() || undefined,
        });

        return { status: 200, body: result };
    } catch (err) {
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
