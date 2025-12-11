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
            collection.createIndex({ createdAt: -1 }),
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
    const doc = await collection.findOne({ stripeSessionId });
    return doc ? toOrder(doc) : null;
}

export async function updateOrderStatus(stripeSessionId: string, status: OrderStatus): Promise<Order> {
    const collection = await getOrderCollection();
    const now = new Date();

    const result = await collection.findOneAndUpdate(
        { stripeSessionId },
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
