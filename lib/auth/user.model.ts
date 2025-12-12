import { ObjectId } from '@/lib/db/mongo-client';

export interface UserDocument {
    _id: ObjectId;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface User {
    id: string;
    email: string;
    createdAt: string;
    updatedAt: string;
}

export function toUser(doc: UserDocument): User {
    return {
        id: doc._id.toHexString(),
        email: doc.email,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    };
}
