import { ObjectId } from '@/lib/db/mongo-client';

export interface RecentlyViewedDocument {
    _id: ObjectId;
    sessionId: string;
    userId?: ObjectId;
    productId: ObjectId;
    viewedAt: Date;
}

export type RecentlyViewedInsert = Omit<RecentlyViewedDocument, '_id'>;
