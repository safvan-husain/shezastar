import { enforceServerOnly } from '@/lib/utils/server-only';

import { getCollection, ObjectId } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import { Order, OrderDocument, toOrder, OrderStatus } from './model/order.model';
import { buildPendingRefundFromOrder, queueRefundForApprovedCancellation, queueRefundForOrder } from '@/lib/refund/refund.service';
import { sendAdminOrderEmail, sendCustomerOrderEmail } from '@/lib/email/email.service';
import { createB2cShipment, createC2bShipment } from '@/lib/shipping/shipping.service';
import type { CreateShipmentInput } from '@/lib/shipping/shipping.schema';

const COLLECTION = 'orders';
const NON_SUCCESS_ORDER_STATUSES: OrderStatus[] = [
    'pending',
    'cancelled',
    'refunded',
    'failed',
    'refund_failed',
    'cancellation_requested',
    'cancellation_approved',
    'return_requested',
    'return_approved',
    'refund_approved',
];

let indexesEnsured = false;

export interface OrderCancellationActor {
    sessionId: string;
    userId?: string;
}

export interface AdminReviewCancellationInput {
    decision: 'approve' | 'reject';
    proceedToShipment?: boolean;
    note?: string;
}

export interface AdminReviewReturnInput {
    decision: 'approve' | 'reject';
    note?: string;
}

function parseOrderObjectId(id: string): ObjectId {
    try {
        return new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ORDER_ID', { id });
    }
}

function parseOptionalObjectId(id?: string): ObjectId | undefined {
    if (!id) {
        return undefined;
    }
    try {
        return new ObjectId(id);
    } catch {
        return undefined;
    }
}

function normalizeOptionalText(value?: string): string | undefined {
    const trimmed = value?.trim();
    return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function isWorkflowManagedStatus(status: OrderStatus): boolean {
    return [
        'cancellation_requested',
        'cancellation_approved',
        'return_requested',
        'return_approved',
        'refund_approved',
        'refund_failed',
        'refunded',
    ].includes(status);
}

function canRequestReturn(doc: OrderDocument): boolean {
    if (!doc.shipping?.awb) {
        return false;
    }

    return ![
        'pending',
        'paid',
        'cancelled',
        'cancellation_requested',
        'cancellation_approved',
        'return_requested',
        'return_approved',
        'refund_approved',
        'refunded',
        'failed',
        'refund_failed',
    ].includes(doc.status);
}

function applyQueuedRefundToPendingRefund(
    pendingRefund: ReturnType<typeof buildPendingRefundFromOrder>,
    queuedRefund: Awaited<ReturnType<typeof queueRefundForOrder>>,
) {
    if (queuedRefund.externalRefundId) {
        pendingRefund.externalRefundId = queuedRefund.externalRefundId;
    }
    if (queuedRefund.requestedAt) {
        pendingRefund.requestedAt = queuedRefund.requestedAt;
    }
    if (typeof queuedRefund.amount === 'number') {
        pendingRefund.amount = queuedRefund.amount;
    }
    if (queuedRefund.currency) {
        pendingRefund.currency = queuedRefund.currency;
    }
    return pendingRefund;
}

function isRefundImmediatelyFinalized(
    queuedRefund: Awaited<ReturnType<typeof queueRefundForOrder>>,
): boolean {
    return queuedRefund.provider === 'tabby' && queuedRefund.succeeded === true;
}

async function createShipmentDocument(order: Order, input: CreateShipmentInput = {}): Promise<NonNullable<OrderDocument['shipping']>> {
    const response = await createB2cShipment(order, input);
    const awb = response.waybills?.[0]?.awb?.trim() || response.sawb.trim();

    return {
        provider: 'smsa',
        awb,
        createdAt: new Date(),
        status: 'created',
        labelPdf: response.waybills?.[0]?.awbFile,
    };
}

async function createReturnShipmentDocument(order: Order, input: CreateShipmentInput = {}): Promise<NonNullable<OrderDocument['shipping']>> {
    const response = await createC2bShipment(order, input);
    const awb = response.waybills?.[0]?.awb?.trim() || response.sawb.trim();

    return {
        provider: 'smsa',
        awb,
        createdAt: new Date(),
        status: 'created',
        labelPdf: response.waybills?.[0]?.awbFile,
    };
}

function emitOrderStatusEmails(previousStatus: OrderStatus, updatedOrder: Order) {
    if (previousStatus === updatedOrder.status) {
        return;
    }

    if (updatedOrder.status === 'paid') {
        void sendCustomerOrderEmail('order_paid', updatedOrder);
        void sendAdminOrderEmail('admin_new_order', updatedOrder);
    }

    if (updatedOrder.status === 'requested_shipment' || updatedOrder.status === 'shipped') {
        void sendCustomerOrderEmail('shipment_approved', updatedOrder);
    }

    if (updatedOrder.status === 'cancellation_approved') {
        void sendCustomerOrderEmail('cancellation_approved', updatedOrder);
    }

    if (updatedOrder.status === 'return_approved') {
        void sendCustomerOrderEmail('return_approved', updatedOrder);
    }

    if (updatedOrder.status === 'refunded') {
        void sendCustomerOrderEmail('refunded', updatedOrder);
    }

    if (updatedOrder.status === 'cancelled') {
        void sendCustomerOrderEmail('order_cancelled', updatedOrder);
    }
}

async function getOrderCollection() {
    const collection = await getCollection<OrderDocument>(COLLECTION);
    if (!indexesEnsured) {
        await Promise.all([
            collection.createIndex({ sessionId: 1 }),
            collection.createIndex({ userId: 1 }),
            collection.createIndex({ stripeSessionId: 1 }, { unique: true, sparse: true }),
            collection.createIndex({ paymentProviderSessionId: 1 }, { unique: true, sparse: true }),
            collection.createIndex({ paymentProviderOrderId: 1 }, { unique: true, sparse: true }),
            collection.createIndex({ createdAt: -1 }),
            collection.createIndex({ status: 1, createdAt: -1 }),
        ]);
        indexesEnsured = true;
    }
    return collection;
}

export async function createOrder(orderData: Omit<OrderDocument, '_id' | 'createdAt' | 'updatedAt'>): Promise<Order> {
    const collection = await getOrderCollection();
    const now = new Date();
    const doc: OrderDocument = {
        ...orderData,
        _id: new ObjectId(),
        createdAt: now,
        updatedAt: now,
    };

    await collection.insertOne(doc);
    return toOrder(doc);
}

export async function getOrderByStripeSessionId(stripeSessionId: string): Promise<Order | null> {
    const collection = await getOrderCollection();
    const doc = await collection.findOne({
        $or: [
            { stripeSessionId },
            { paymentProviderSessionId: stripeSessionId }
        ]
    });
    return doc ? toOrder(doc) : null;
}

export async function getOrderByPaymentProviderSessionId(paymentProviderSessionId: string): Promise<Order | null> {
    const collection = await getOrderCollection();
    const doc = await collection.findOne({ paymentProviderSessionId });
    return doc ? toOrder(doc) : null;
}

export async function updateOrderStatus(stripeSessionId: string, status: OrderStatus): Promise<Order> {
    const collection = await getOrderCollection();
    const now = new Date();

    const result = await collection.findOneAndUpdate(
        {
            $or: [
                { stripeSessionId: stripeSessionId },
                { paymentProviderSessionId: stripeSessionId }
            ]
        },
        {
            $set: {
                status,
                updatedAt: now
            }
        },
        { returnDocument: 'after' }
    );

    if (!result) {
        throw new AppError(404, 'ORDER_NOT_FOUND', { message: `Order with stripe session id ${stripeSessionId} not found` });
    }

    return toOrder(result);
}

export async function getOrdersBySessionId(sessionId: string): Promise<Order[]> {
    const collection = await getOrderCollection();
    const docs = await collection.find({ sessionId }).sort({ createdAt: -1 }).toArray();
    return docs.map(toOrder);
}

export async function getOrderById(id: string): Promise<Order> {
    const objectId = parseOrderObjectId(id);

    const collection = await getOrderCollection();
    const doc = await collection.findOne({ _id: objectId });

    if (!doc) {
        throw new AppError(404, 'ORDER_NOT_FOUND', { id });
    }

    return toOrder(doc);
}

export async function listOrders(params: {
    page?: number;
    limit?: number;
    status?: OrderStatus;
}): Promise<{
    orders: Order[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
    const page = Math.max(1, params.page ?? 1);
    const limit = Math.min(Math.max(1, params.limit ?? 20), 100);

    const filter: Partial<OrderDocument> = {};

    if (params.status) {
        filter.status = params.status;
    }

    const collection = await getOrderCollection();

    const total = await collection.countDocuments(filter);
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    const docs = await collection
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

    const orders = docs.map(toOrder);

    return {
        orders,
        pagination: {
            page,
            limit,
            total,
            totalPages,
        },
    };
}

export async function listOrderPendingActions(): Promise<{
    pendingShipment: Order[];
    cancellationRequests: Order[];
    returnRequests: Order[];
    total: number;
}> {
    const collection = await getOrderCollection();

    const [pendingShipmentDocs, cancellationRequestDocs, returnRequestDocs] = await Promise.all([
        collection
            .find({
                status: 'paid',
                'shipping.awb': { $exists: false },
            })
            .sort({ createdAt: -1 })
            .toArray(),
        collection
            .find({
                status: 'cancellation_requested',
                'cancellation.requestedAt': { $exists: true },
            })
            .sort({ 'cancellation.requestedAt': -1, updatedAt: -1 })
            .toArray(),
        collection
            .find({
                status: 'return_requested',
                'returnRequest.requestedAt': { $exists: true },
            })
            .sort({ 'returnRequest.requestedAt': -1, updatedAt: -1 })
            .toArray(),
    ]);

    return {
        pendingShipment: pendingShipmentDocs.map(toOrder),
        cancellationRequests: cancellationRequestDocs.map(toOrder),
        returnRequests: returnRequestDocs.map(toOrder),
        total:
            pendingShipmentDocs.length +
            cancellationRequestDocs.length +
            returnRequestDocs.length,
    };
}

export async function updateOrderStatusById(
    id: string,
    status: OrderStatus,
    options?: { allowWorkflowStatuses?: boolean },
): Promise<Order> {
    const objectId = parseOrderObjectId(id);

    const collection = await getOrderCollection();
    const existing = await collection.findOne({ _id: objectId });

    if (!existing) {
        throw new AppError(404, 'ORDER_NOT_FOUND', { id });
    }

    if (!options?.allowWorkflowStatuses && (isWorkflowManagedStatus(existing.status) || isWorkflowManagedStatus(status))) {
        throw new AppError(409, 'ORDER_STATUS_MANAGED_SEPARATELY', {
            id,
            currentStatus: existing.status,
            nextStatus: status,
        });
    }

    const now = new Date();

    const result = await collection.findOneAndUpdate(
        { _id: objectId },
        {
            $set: {
                status,
                updatedAt: now,
            },
        },
        { returnDocument: 'after' }
    );

    const updatedOrder = toOrder(result ?? existing);

    emitOrderStatusEmails(existing.status, updatedOrder);

    return updatedOrder;
}

export async function setOrderShipping(id: string, shipping: NonNullable<OrderDocument['shipping']>): Promise<Order> {
    const objectId = parseOrderObjectId(id);
    const collection = await getOrderCollection();
    
    const result = await collection.findOneAndUpdate(
        { _id: objectId },
        {
            $set: {
                shipping,
                updatedAt: new Date(),
            },
        },
        { returnDocument: 'after' }
    );

    if (!result) {
        throw new AppError(404, 'ORDER_NOT_FOUND', { id });
    }

    return toOrder(result);
}

export async function setOrderReturnShipment(id: string, shipment: NonNullable<NonNullable<OrderDocument['returnRequest']>['shipment']>): Promise<Order> {
    const objectId = parseOrderObjectId(id);
    const collection = await getOrderCollection();

    const result = await collection.findOneAndUpdate(
        { _id: objectId },
        {
            $set: {
                'returnRequest.shipment': shipment,
                updatedAt: new Date(),
            },
        },
        { returnDocument: 'after' },
    );

    if (!result) {
        throw new AppError(404, 'ORDER_NOT_FOUND', { id });
    }

    return toOrder(result);
}

export async function updateOrderShippingStatus(id: string, status: string, lastTrackedAt: Date): Promise<Order> {
    const objectId = parseOrderObjectId(id);
    const collection = await getOrderCollection();
    
    const result = await collection.findOneAndUpdate(
        { _id: objectId },
        {
            $set: {
                'shipping.status': status,
                'shipping.lastTrackedAt': lastTrackedAt,
                updatedAt: new Date(),
            },
        },
        { returnDocument: 'after' }
    );

    if (!result) {
        throw new AppError(404, 'ORDER_NOT_FOUND', { id });
    }

    return toOrder(result);
}

function assertOrderOwnership(doc: OrderDocument, actor: OrderCancellationActor, orderId: string): void {
    if (doc.userId) {
        if (!actor.userId || doc.userId.toHexString() !== actor.userId) {
            throw new AppError(403, 'ORDER_ACCESS_DENIED', { id: orderId });
        }
        return;
    }

    if (doc.sessionId !== actor.sessionId) {
        throw new AppError(403, 'ORDER_ACCESS_DENIED', { id: orderId });
    }
}

export async function requestOrderCancellationByCustomer(
    id: string,
    actor: OrderCancellationActor,
    reason: string,
): Promise<Order> {
    const objectId = parseOrderObjectId(id);
    const collection = await getOrderCollection();

    const doc = await collection.findOne({ _id: objectId });

    if (!doc) {
        throw new AppError(404, 'ORDER_NOT_FOUND', { id });
    }

    assertOrderOwnership(doc, actor, id);

    if (doc.cancellation?.requestedAt) {
        throw new AppError(409, 'CANCELLATION_REQUEST_ALREADY_SUBMITTED', { id });
    }

    if (doc.status !== 'paid') {
        throw new AppError(409, 'ORDER_NOT_CANCELLABLE', { id, status: doc.status });
    }
    if (doc.shipping?.awb) {
        throw new AppError(409, 'ORDER_NOT_CANCELLABLE', {
            id,
            status: doc.status,
            message: 'Order already has an active shipment.',
            awb: doc.shipping.awb,
        });
    }

    const now = new Date();
    const requestedByUserId = parseOptionalObjectId(actor.userId);
    const cancellation: NonNullable<OrderDocument['cancellation']> = {
        requestedAt: now,
        requestReason: reason.trim(),
        adminDecision: 'pending',
        requestedBySessionId: actor.sessionId,
        requestedByUserId,
    };

    const result = await collection.findOneAndUpdate(
        { _id: objectId },
        {
            $set: {
                status: 'cancellation_requested',
                cancellation,
                updatedAt: now,
            },
        },
        { returnDocument: 'after' },
    );

    if (!result) {
        throw new AppError(404, 'ORDER_NOT_FOUND', { id });
    }

    const updatedOrder = toOrder(result);
    void sendAdminOrderEmail('admin_cancellation_requested', updatedOrder);

    return updatedOrder;
}

export async function requestOrderReturnByCustomer(
    id: string,
    actor: OrderCancellationActor,
    reason: string,
): Promise<Order> {
    const objectId = parseOrderObjectId(id);
    const collection = await getOrderCollection();
    const doc = await collection.findOne({ _id: objectId });

    if (!doc) {
        throw new AppError(404, 'ORDER_NOT_FOUND', { id });
    }

    assertOrderOwnership(doc, actor, id);

    if (doc.returnRequest?.requestedAt && doc.status === 'return_requested') {
        throw new AppError(409, 'RETURN_REQUEST_ALREADY_SUBMITTED', { id });
    }

    if (!canRequestReturn(doc)) {
        throw new AppError(409, 'ORDER_NOT_RETURNABLE', { id, status: doc.status });
    }

    const now = new Date();
    const returnRequest: NonNullable<OrderDocument['returnRequest']> = {
        requestedAt: now,
        requestReason: reason.trim(),
        adminDecision: 'pending',
        requestedBySessionId: actor.sessionId,
        requestedByUserId: parseOptionalObjectId(actor.userId),
        requestedFromStatus: doc.status,
    };

    const result = await collection.findOneAndUpdate(
        { _id: objectId },
        {
            $set: {
                status: 'return_requested',
                returnRequest,
                updatedAt: now,
            },
        },
        { returnDocument: 'after' },
    );

    if (!result) {
        throw new AppError(404, 'ORDER_NOT_FOUND', { id });
    }

    const updatedOrder = toOrder(result);
    void sendAdminOrderEmail('admin_return_requested', updatedOrder);

    return updatedOrder;
}

export async function reviewOrderCancellationByAdmin(
    id: string,
    input: AdminReviewCancellationInput,
): Promise<Order> {
    const objectId = parseOrderObjectId(id);
    const collection = await getOrderCollection();
    const doc = await collection.findOne({ _id: objectId });

    if (!doc) {
        throw new AppError(404, 'ORDER_NOT_FOUND', { id });
    }

    if (!doc.cancellation?.requestedAt) {
        throw new AppError(409, 'CANCELLATION_REQUEST_NOT_FOUND', { id });
    }

    if (doc.status !== 'cancellation_requested') {
        throw new AppError(409, 'ORDER_NOT_IN_CANCELLATION_REVIEW', { id, status: doc.status });
    }

    const now = new Date();
    const adminNote = normalizeOptionalText(input.note);
    const existingCancellation = doc.cancellation ?? {};
    const cancellation: NonNullable<OrderDocument['cancellation']> = {
        ...existingCancellation,
        adminDecision: input.decision === 'approve' ? 'approved' : 'rejected',
    };

    if (adminNote) {
        cancellation.adminNote = adminNote;
    }

    if (input.decision === 'approve') {
        cancellation.approvedAt = now;
    } else {
        cancellation.rejectedAt = now;
    }

    const nextStatus: OrderStatus = input.decision === 'approve'
        ? 'cancellation_approved'
        : input.proceedToShipment
            ? 'requested_shipment'
            : 'paid';
    const updatePayload: Partial<OrderDocument> = {
        status: nextStatus,
        cancellation,
        updatedAt: now,
    };

    if (input.decision === 'approve') {
        const order = toOrder(doc);
        const pendingRefund = buildPendingRefundFromOrder(order);
        const queuedRefund = await queueRefundForApprovedCancellation(order);
        updatePayload.refund = applyQueuedRefundToPendingRefund(pendingRefund, queuedRefund);
        if (isRefundImmediatelyFinalized(queuedRefund)) {
            cancellation.completedAt = now;
            updatePayload.cancellation = cancellation;
            updatePayload.status = 'refunded';
        }
    }

    if (input.decision === 'reject' && input.proceedToShipment) {
        const order = toOrder(doc);
        updatePayload.shipping = await createShipmentDocument(order);
    }

    const result = await collection.findOneAndUpdate(
        { _id: objectId },
        {
            $set: updatePayload,
        },
        { returnDocument: 'after' },
    );

    if (!result) {
        throw new AppError(404, 'ORDER_NOT_FOUND', { id });
    }

    const updatedOrder = toOrder(result);
    emitOrderStatusEmails(doc.status, updatedOrder);

    return updatedOrder;
}

export async function reviewOrderReturnByAdmin(
    id: string,
    input: AdminReviewReturnInput,
): Promise<Order> {
    const objectId = parseOrderObjectId(id);
    const collection = await getOrderCollection();
    const doc = await collection.findOne({ _id: objectId });

    if (!doc) {
        throw new AppError(404, 'ORDER_NOT_FOUND', { id });
    }

    if (!doc.returnRequest?.requestedAt) {
        throw new AppError(409, 'RETURN_REQUEST_NOT_FOUND', { id });
    }

    if (doc.status !== 'return_requested') {
        throw new AppError(409, 'ORDER_NOT_IN_RETURN_REVIEW', { id, status: doc.status });
    }

    const now = new Date();
    const adminNote = normalizeOptionalText(input.note);
    const returnRequest: NonNullable<OrderDocument['returnRequest']> = {
        ...doc.returnRequest,
        adminDecision: input.decision === 'approve' ? 'approved' : 'rejected',
    };

    if (adminNote) {
        returnRequest.adminNote = adminNote;
    }

    const updatePayload: Partial<OrderDocument> = {
        updatedAt: now,
    };

    if (input.decision === 'approve') {
        returnRequest.approvedAt = now;
        returnRequest.shipment = await createReturnShipmentDocument(toOrder(doc));
        updatePayload.status = 'return_approved';
    } else {
        returnRequest.rejectedAt = now;
        updatePayload.status = doc.returnRequest.requestedFromStatus || 'requested_shipment';
    }

    updatePayload.returnRequest = returnRequest;

    const result = await collection.findOneAndUpdate(
        { _id: objectId },
        {
            $set: updatePayload,
        },
        { returnDocument: 'after' },
    );

    if (!result) {
        throw new AppError(404, 'ORDER_NOT_FOUND', { id });
    }

    const updatedOrder = toOrder(result);
    emitOrderStatusEmails(doc.status, updatedOrder);
    return updatedOrder;
}

export async function proceedOrderRefundByAdmin(id: string): Promise<Order> {
    const objectId = parseOrderObjectId(id);
    const collection = await getOrderCollection();
    const doc = await collection.findOne({ _id: objectId });

    if (!doc) {
        throw new AppError(404, 'ORDER_NOT_FOUND', { id });
    }

    if (doc.status !== 'return_approved') {
        throw new AppError(409, 'ORDER_NOT_READY_FOR_REFUND', { id, status: doc.status });
    }

    const order = toOrder(doc);
    const pendingRefund = buildPendingRefundFromOrder(order);
    const queuedRefund = await queueRefundForOrder(order);
    const refund = applyQueuedRefundToPendingRefund(pendingRefund, queuedRefund);
    const now = new Date();
    const nextStatus = isRefundImmediatelyFinalized(queuedRefund) ? 'refunded' : 'refund_approved';
    const returnRequest = isRefundImmediatelyFinalized(queuedRefund) && doc.returnRequest
        ? {
            ...doc.returnRequest,
            completedAt: now,
        }
        : undefined;

    const result = await collection.findOneAndUpdate(
        { _id: objectId },
        {
            $set: {
                status: nextStatus,
                refund,
                ...(returnRequest ? { returnRequest } : {}),
                updatedAt: now,
            },
        },
        { returnDocument: 'after' },
    );

    if (!result) {
        throw new AppError(404, 'ORDER_NOT_FOUND', { id });
    }

    return toOrder(result);
}

export async function countOrdersByEmail(email: string): Promise<number> {
    const collection = await getOrderCollection();
    return collection.countDocuments({
        "billingDetails.email": email,
        status: { $nin: NON_SUCCESS_ORDER_STATUSES },
    });
}

export async function getOrdersByEmail(email: string, limit: number = 10): Promise<Order[]> {
    const collection = await getOrderCollection();
    const docs = await collection.find({
        "billingDetails.email": email,
        status: { $nin: NON_SUCCESS_ORDER_STATUSES },
    })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
    return docs.map(toOrder);
}
export async function getOrdersByUserId(userId: string, limit: number = 10): Promise<Order[]> {
    const { ObjectId } = await import('mongodb');
    const collection = await getOrderCollection();
    const docs = await collection.find({
        userId: new ObjectId(userId),
    })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
    return docs.map(toOrder);
}

export async function getSuccessfulOrdersByUserId(userId: string, limit: number = 10): Promise<Order[]> {
    const { ObjectId } = await import('mongodb');
    const collection = await getOrderCollection();
    const docs = await collection.find({
        userId: new ObjectId(userId),
        status: { $nin: NON_SUCCESS_ORDER_STATUSES },
    })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
    return docs.map(toOrder);
}

export async function getSuccessfulOrdersBySessionId(sessionId: string, limit: number = 10): Promise<Order[]> {
    const collection = await getOrderCollection();
    const docs = await collection.find({
        sessionId,
        status: { $nin: NON_SUCCESS_ORDER_STATUSES },
    })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
    return docs.map(toOrder);
}
enforceServerOnly('order.service');
