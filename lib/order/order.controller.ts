import { catchError } from '@/lib/errors/app-error';
import { buildCustomerActivityActor, createActivityLog } from '@/lib/activity/activity.service';
import type { ActivityActor, ActivityEntity } from '@/lib/activity/model/activity.model';
import {
    listOrders,
    listOrderPendingActions,
    getOrderById,
    updateOrderStatusById,
    requestOrderCancellationByCustomer,
    requestOrderReturnByCustomer,
    reviewOrderCancellationByAdmin,
    reviewOrderReturnByAdmin,
    proceedOrderRefundByAdmin,
    type OrderCancellationActor,
} from './order.service';
import { 
    UpdateOrderStatusSchema, 
    RequestOrderCancellationSchema, 
    ReviewOrderCancellationSchema,
    RequestOrderReturnSchema,
    ReviewOrderReturnSchema,
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

export async function handleAdminListOrderPendingActions() {
    try {
        const result = await listOrderPendingActions();
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

export async function handleRequestOrderReturnByCustomer(
    id: string,
    input: unknown,
    actor: OrderCancellationActor,
) {
    try {
        const parsed = RequestOrderReturnSchema.parse(input);
        const result = await requestOrderReturnByCustomer(id, actor, parsed.reason);

        await createActivityLog({
            actionType: 'order.return_requested',
            actor: buildCustomerActivityActor({
                sessionId: actor.sessionId,
                userId: actor.userId,
            }),
            primaryEntity: buildOrderEntity(result),
            relatedEntities: buildOrderRelatedProducts(result),
            summary: `Customer requested return for ${buildOrderEntity(result).label}`,
            details: {
                reason: parsed.reason,
                status: result.status,
            },
        });

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

export async function handleAdminReviewOrderReturnRequest(id: string, input: unknown, actor?: ActivityActor) {
    try {
        const previousOrder = actor ? await getOrderById(id) : null;
        const parsed = ReviewOrderReturnSchema.parse(input);
        const result = await reviewOrderReturnByAdmin(id, parsed);

        if (actor) {
            const decisionLabel = parsed.decision === 'approve' ? 'approved' : 'rejected';
            await createActivityLog({
                actionType: 'order.return_reviewed',
                actor,
                primaryEntity: buildOrderEntity(result),
                relatedEntities: buildOrderRelatedProducts(result),
                summary: `${actor.displayName?.trim() || 'Admin'} ${decisionLabel} return for ${buildOrderEntity(result).label}`,
                details: {
                    decision: parsed.decision,
                    note: parsed.note,
                    previousStatus: previousOrder?.status,
                    nextStatus: result.status,
                },
            });
        }

        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleAdminProceedOrderRefund(id: string, actor?: ActivityActor) {
    try {
        const previousOrder = actor ? await getOrderById(id) : null;
        const result = await proceedOrderRefundByAdmin(id);

        if (actor) {
            await createActivityLog({
                actionType: 'order.refund_initiated',
                actor,
                primaryEntity: buildOrderEntity(result),
                relatedEntities: buildOrderRelatedProducts(result),
                summary: `${actor.displayName?.trim() || 'Admin'} initiated refund for ${buildOrderEntity(result).label}`,
                details: {
                    previousStatus: previousOrder?.status,
                    nextStatus: result.status,
                    refundStatus: result.refund?.status,
                    refundProvider: result.refund?.provider,
                },
            });
        }

        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}
