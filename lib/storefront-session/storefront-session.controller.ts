import {
    EnsureStorefrontSessionSchema,
    StorefrontSessionSchema,
} from './storefront-session.schema';
import {
    ensureStorefrontSession,
    getStorefrontSession,
    revokeStorefrontSession,
} from './storefront-session.service';
import { catchError } from '@/lib/errors/app-error';

export async function handleEnsureStorefrontSession(input: unknown) {
    try {
        const parsed = EnsureStorefrontSessionSchema.parse(input ?? {});
        const session = await ensureStorefrontSession(parsed);
        return { status: 200, body: StorefrontSessionSchema.parse(session) };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleGetStorefrontSession() {
    try {
        const session = await getStorefrontSession();
        if (!session) {
            return {
                status: 404,
                body: { code: 'SESSION_NOT_FOUND', error: 'SESSION_NOT_FOUND' },
            };
        }
        return { status: 200, body: StorefrontSessionSchema.parse(session) };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleRevokeStorefrontSession() {
    try {
        const result = await revokeStorefrontSession();
        return {
            status: 200,
            body: { success: result.success },
        };
    } catch (err) {
        return catchError(err);
    }
}
