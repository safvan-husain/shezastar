import { ObjectId } from '@/lib/db/mongo-client';

export type StorefrontSessionStatus = 'active' | 'revoked';

export interface StorefrontSessionMetadata {
    userAgent?: string;
    ipHash?: string;
}

export interface StorefrontSessionDocument {
    _id: ObjectId;
    sessionId: string;
    status: StorefrontSessionStatus;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
    lastActiveAt: Date;
    cartId?: ObjectId;
    wishlistId?: ObjectId;
    metadata?: StorefrontSessionMetadata;
}

export interface StorefrontSession {
    sessionId: string;
    status: StorefrontSessionStatus;
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
    lastActiveAt: string;
    cartId?: string;
    wishlistId?: string;
    metadata?: StorefrontSessionMetadata;
}

export type StorefrontSessionInsert = Omit<StorefrontSessionDocument, '_id'>;

export function buildStorefrontSessionDocument(
    sessionId: string,
    expiresAt: Date,
    metadata?: StorefrontSessionMetadata
): StorefrontSessionInsert {
    const now = new Date();
    return {
        sessionId,
        status: 'active',
        createdAt: now,
        updatedAt: now,
        expiresAt,
        lastActiveAt: now,
        metadata,
    };
}

export function toStorefrontSession(doc: StorefrontSessionDocument): StorefrontSession {
    return {
        sessionId: doc.sessionId,
        status: doc.status,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
        expiresAt: doc.expiresAt.toISOString(),
        lastActiveAt: doc.lastActiveAt.toISOString(),
        cartId: doc.cartId?.toHexString(),
        wishlistId: doc.wishlistId?.toHexString(),
        metadata: doc.metadata,
    };
}
