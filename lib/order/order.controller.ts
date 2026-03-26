import { catchError } from '@/lib/errors/app-error';
import { createActivityLog } from '@/lib/activity/activity.service';
import type { ActivityActor, ActivityEntity } from '@/lib/activity/model/activity.model';
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

function buildOrderEntity(order: { id: string }): ActivityEntity {
    return {
        kind: 'order',
        id: order.id,
        label: `Order #${order.id.slice(0, 8)}`,
    };
}

function buildOrderRelatedProducts(order: Awaited<ReturnType<typeof getOrderById>>) {
    return order.items.map((item) => ({
        kind: 'product' as const,
        id: item.productId,
        label: item.productName,
    }));
}

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

export async function handleAdminUpdateOrderStatus(id: string, input: unknown, actor?: ActivityActor) {
    try {
        const previousOrder = actor ? await getOrderById(id) : null;
        const parsed = UpdateOrderStatusSchema.parse(input);
        const result = await updateOrderStatusById(id, parsed.status);

        if (actor && previousOrder && previousOrder.status !== result.status) {
            await createActivityLog({
                actionType: 'order.status_updated',
                actor,
                primaryEntity: buildOrderEntity(result),
                relatedEntities: buildOrderRelatedProducts(result),
                summary: `${actor.displayName?.trim() || 'Admin'} updated ${buildOrderEntity(result).label} to ${result.status}`,
                details: {
                    previousStatus: previousOrder.status,
                    nextStatus: result.status,
                    totalAmount: result.totalAmount,
                    currency: result.currency,
                },
            });
        }

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

export async function handleAdminReviewOrderCancellationRequest(id: string, input: unknown, actor?: ActivityActor) {
    try {
        const previousOrder = actor ? await getOrderById(id) : null;
        const parsed = ReviewOrderCancellationSchema.parse(input);
        const result = await reviewOrderCancellationByAdmin(id, parsed);

        if (actor) {
            const decisionLabel = parsed.decision === 'approve' ? 'approved' : 'rejected';
            await createActivityLog({
                actionType: 'order.cancellation_reviewed',
                actor,
                primaryEntity: buildOrderEntity(result),
                relatedEntities: buildOrderRelatedProducts(result),
                summary: `${actor.displayName?.trim() || 'Admin'} ${decisionLabel} cancellation for ${buildOrderEntity(result).label}`,
                details: {
                    decision: parsed.decision,
                    note: parsed.note,
                    previousStatus: previousOrder?.status,
                    nextStatus: result.status,
                    refundStatus: result.refund?.status,
                },
            });
        }

        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}
