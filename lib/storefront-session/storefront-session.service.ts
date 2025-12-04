import 'server-only';

import { createHash, randomBytes } from 'node:crypto';

import { getCollection } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import {
    StorefrontSession,
    StorefrontSessionDocument,
    StorefrontSessionMetadata,
    buildStorefrontSessionDocument,
    toStorefrontSession,
} from './model/storefront-session.model';
import {
    EnsureStorefrontSessionInput,
    StorefrontSessionMetadataInput,
} from './storefront-session.schema';
import {
    getCurrentStorefrontSessionToken,
    revokeStorefrontSessionCookie,
    setStorefrontSessionCookie,
} from './session-token';

const COLLECTION = 'userSessions';
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30;

let indexesEnsured = false;

async function getSessionCollection() {
    const collection = await getCollection<StorefrontSessionDocument>(COLLECTION);
    if (!indexesEnsured) {
        await Promise.all([
            collection.createIndex({ sessionId: 1 }, { unique: true }),
            collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
        ]);
        indexesEnsured = true;
    }
    return collection;
}

function computeExpiry() {
    return new Date(Date.now() + SESSION_DURATION_MS);
}

function normalizeMetadata(metadata?: StorefrontSessionMetadataInput): StorefrontSessionMetadata | undefined {
    if (!metadata) {
        return undefined;
    }

    const normalized: StorefrontSessionMetadata = {};
    if (metadata.userAgent) {
        normalized.userAgent = metadata.userAgent;
    }
    if (metadata.ipAddress) {
        normalized.ipHash = createHash('sha256').update(metadata.ipAddress).digest('hex');
    }

    return Object.keys(normalized).length ? normalized : undefined;
}

async function findActiveSession(sessionId: string) {
    const collection = await getSessionCollection();
    const doc = await collection.findOne({ sessionId });
    if (!doc) {
        throw new AppError(404, 'SESSION_NOT_FOUND');
    }
    if (doc.status !== 'active') {
        throw new AppError(401, 'SESSION_REVOKED');
    }
    if (doc.expiresAt.getTime() <= Date.now()) {
        await collection.updateOne(
            { sessionId },
            { $set: { status: 'revoked', updatedAt: new Date() } }
        );
        throw new AppError(401, 'SESSION_EXPIRED');
    }
    return doc;
}

async function updateActivity(
    sessionId: string,
    doc: StorefrontSessionDocument,
    metadata?: StorefrontSessionMetadataInput
) {
    const collection = await getSessionCollection();
    const now = new Date();
    const expiresAt = computeExpiry();
    const metadataUpdate = normalizeMetadata(metadata);

    const updateDoc: Partial<StorefrontSessionDocument> = {
        updatedAt: now,
        lastActiveAt: now,
        expiresAt,
    };

    if (metadataUpdate) {
        updateDoc.metadata = { ...(doc.metadata ?? {}), ...metadataUpdate };
    }

    const updated = await collection.findOneAndUpdate(
        { sessionId },
        { $set: updateDoc },
        { returnDocument: 'after' }
    );
    
    if (!updated) {
        throw new AppError(500, 'SESSION_UPDATE_FAILED');
    }
    return updated;
}

export async function createStorefrontSession(
    sessionId: string,
    metadata?: StorefrontSessionMetadataInput,
    setCookie: boolean = false
): Promise<StorefrontSession> {
    const expiresAt = computeExpiry();
    const doc = buildStorefrontSessionDocument(sessionId, expiresAt, normalizeMetadata(metadata));
    const collection = await getSessionCollection();
    const result = await collection.insertOne(doc as StorefrontSessionDocument);
    const created = await collection.findOne({ _id: result.insertedId });
    if (!created) {
        throw new AppError(500, 'SESSION_CREATE_FAILED');
    }
    const storefrontSession = toStorefrontSession(created);
    if (setCookie) {
        await setStorefrontSessionCookie(storefrontSession.sessionId);
    }
    return storefrontSession;
}

export async function touchStorefrontSession(
    sessionId: string,
    metadata?: StorefrontSessionMetadataInput,
    setCookie: boolean = false
): Promise<StorefrontSession> {
    const doc = await findActiveSession(sessionId);
    const updated = await updateActivity(sessionId, doc, metadata);
    const storefrontSession = toStorefrontSession(updated);
    if (setCookie) {
        await setStorefrontSessionCookie(storefrontSession.sessionId);
    }
    return storefrontSession;
}

export async function ensureStorefrontSession(
    input?: EnsureStorefrontSessionInput
): Promise<StorefrontSession> {
    const payload = input?.metadata;
    const token = await getCurrentStorefrontSessionToken();
    if (!token) {
        // Session ID should be created by middleware, but create one if missing
        return createStorefrontSession(randomBytes(16).toString('hex'), payload, true);
    }

    try {
        return await touchStorefrontSession(token.sessionId, payload, true);
    } catch (err) {
        if (
            err instanceof AppError &&
            ['SESSION_NOT_FOUND', 'SESSION_REVOKED', 'SESSION_EXPIRED'].includes(err.code)
        ) {
            // Create new session with existing token's sessionId
            return createStorefrontSession(token.sessionId, payload, true);
        }
        throw err;
    }
}

export async function getStorefrontSession(): Promise<StorefrontSession | null> {
    const token = await getCurrentStorefrontSessionToken();
    if (!token) {
        return null;
    }
    try {
        const doc = await findActiveSession(token.sessionId);
        return toStorefrontSession(doc);
    } catch (err) {
        if (err instanceof AppError) {
            await revokeStorefrontSessionCookie();
            return null;
        }
        throw err;
    }
}

export async function revokeStorefrontSession(sessionId?: string) {
    const collection = await getSessionCollection();
    let targetId = sessionId;
    if (!targetId) {
        const token = await getCurrentStorefrontSessionToken();
        targetId = token?.sessionId;
    }

    if (targetId) {
        await collection.updateOne(
            { sessionId: targetId },
            { $set: { status: 'revoked', updatedAt: new Date() } }
        );
    }

    await revokeStorefrontSessionCookie();

    return { success: Boolean(targetId) };
}

export async function getStorefrontSessionId(): Promise<string | null> {
    const token = await getCurrentStorefrontSessionToken();
    return token?.sessionId ?? null;
}
