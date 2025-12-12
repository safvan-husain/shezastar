import 'server-only';
import { getCollection } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import { hashPassword, verifyPassword } from './password';
import { User, UserDocument, toUser } from './user.model';

const COLLECTION = 'users';

export async function getUserCollection() {
    const collection = await getCollection<UserDocument>(COLLECTION);
    await collection.createIndex({ email: 1 }, { unique: true });
    return collection;
}

export async function registerUser(email: string, password: string): Promise<User> {
    const collection = await getUserCollection();
    const existing = await collection.findOne({ email });
    if (existing) {
        throw new AppError(409, 'EMAIL_ALREADY_EXISTS');
    }

    const passwordHash = await hashPassword(password);
    const now = new Date();

    const result = await collection.insertOne({
        email,
        passwordHash,
        createdAt: now,
        updatedAt: now,
    } as UserDocument);

    const user = await collection.findOne({ _id: result.insertedId });
    if (!user) {
        throw new AppError(500, 'FAILED_TO_CREATE_USER');
    }

    return toUser(user);
}

export async function loginUser(email: string, password: string): Promise<User> {
    const collection = await getUserCollection();
    const user = await collection.findOne({ email });

    if (!user) {
        throw new AppError(401, 'INVALID_CREDENTIALS');
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
        throw new AppError(401, 'INVALID_CREDENTIALS');
    }

    return toUser(user);
}

export async function getUserById(userId: string): Promise<User | null> {
    // Basic implementation for now
    // We'll import ObjectId only when needed to avoid issues if passed invalid strings
    const { ObjectId } = await import('mongodb');

    // Validate format
    if (!ObjectId.isValid(userId)) return null;

    const collection = await getUserCollection();
    const user = await collection.findOne({ _id: new ObjectId(userId) });
    return user ? toUser(user) : null;
}
