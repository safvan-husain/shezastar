import 'server-only';

import { getCollection, ObjectId } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import { Order, OrderDocument, toOrder, OrderStatus } from './model/order.model';

const COLLECTION = 'orders';

let indexesEnsured = false;

async function getOrderCollection() {
    const collection = await getCollection<OrderDocument>(COLLECTION);
    if (!indexesEnsured) {
        await Promise.all([
            collection.createIndex({ sessionId: 1 }),
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
    let objectId: ObjectId;
    try {
        objectId = new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ORDER_ID', { id });
    }

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

export async function updateOrderStatusById(id: string, status: OrderStatus): Promise<Order> {
    let objectId: ObjectId;
    try {
        objectId = new ObjectId(id);
    } catch {
        throw new AppError(400, 'INVALID_ORDER_ID', { id });
    }

    const collection = await getOrderCollection();
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

    if (!result) {
        throw new AppError(404, 'ORDER_NOT_FOUND', { id });
    }

    return toOrder(result);
}

export async function countOrdersByEmail(email: string): Promise<number> {
    const collection = await getOrderCollection();
    return collection.countDocuments({
        "billingDetails.email": email,
        status: { $in: ['paid', 'completed'] }
    });
}

export async function getOrdersByEmail(email: string, limit: number = 10): Promise<Order[]> {
    const collection = await getOrderCollection();
    const docs = await collection.find({
        "billingDetails.email": email,
        status: { $in: ['paid', 'completed'] }
    })
        .sort({ createdAt: -1 })
        .limit(limit)
        .toArray();
    return docs.map(toOrder);
}
