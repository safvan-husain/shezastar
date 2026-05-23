import { enforceServerOnly } from '@/lib/utils/server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHmac, timingSafeEqual } from 'node:crypto';

import { getCollection } from '@/lib/db/mongo-client';
import { AppError } from '@/lib/errors/app-error';
import { AdminDocument, AdminRole } from '@/lib/auth/admin-auth-core';
import {
    getAdminRole,
    getDefaultManagePathForRole,
} from '@/lib/auth/admin-permissions';
import { ObjectId } from 'mongodb';

export * from '@/lib/auth/admin-auth-core';
export * from '@/lib/auth/admin-permissions';

const ADMIN_COOKIE_NAME = 'ss-admin-session';
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days
const SESSION_DURATION_MILLISECONDS = SESSION_DURATION_SECONDS * 1000;

interface AuthPayload {
    adminId: string;
    expires: number;
}

type AdminAuthOptions = {
    roles?: AdminRole[];
};

export async function getAdminDocument(): Promise<AdminDocument | null> {
    const collection = await getCollection<AdminDocument>('admins');
    return collection.findOne({}, { sort: { createdAt: 1 } });
}

export async function getAdminDocumentById(adminId: string): Promise<AdminDocument | null> {
    if (!ObjectId.isValid(adminId)) {
        return null;
    }

    const collection = await getCollection<AdminDocument>('admins');
    return collection.findOne({ _id: new ObjectId(adminId) });
}

export async function getAdminByEmail(email: string): Promise<AdminDocument | null> {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
        return null;
    }

    const collection = await getCollection<AdminDocument>('admins');
    return collection.findOne({ email: normalizedEmail });
}

export function createAdminSessionToken(adminId: string) {
    const expires = Date.now() + SESSION_DURATION_MILLISECONDS;
    const payload = `${adminId}:${expires}`;
    const signature = signPayload(payload);
    return Buffer.from(`${payload}:${signature}`).toString('base64');
}

export function parseAdminSessionToken(token?: string): AuthPayload | null {
    if (!token) {
        return null;
    }

    let decoded: string;
    try {
        decoded = Buffer.from(token, 'base64').toString('utf8');
    } catch {
        return null;
    }

    const [adminId, expiresRaw, signature] = decoded.split(':');
    if (!adminId || !expiresRaw || !signature) {
        return null;
    }

    const expires = Number(expiresRaw);
    if (Number.isNaN(expires) || expires <= Date.now()) {
        return null;
    }

    const payload = `${adminId}:${expires}`;
    const expectedSignature = signPayload(payload);

    try {
        const provided = Buffer.from(signature, 'hex');
        const expected = Buffer.from(expectedSignature, 'hex');
        if (provided.length !== expected.length) {
            return null;
        }
        if (!timingSafeEqual(provided, expected)) {
            return null;
        }
    } catch {
        return null;
    }

    return { adminId, expires };
}

export async function setAdminSessionCookie(adminId: string) {
    const sessionValue = createAdminSessionToken(adminId);
    let cookie = await cookies();
    cookie.set({
        name: ADMIN_COOKIE_NAME,
        value: sessionValue,
        maxAge: SESSION_DURATION_SECONDS,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        sameSite: 'lax',
    });
}

export async function revokeAdminSessionCookie() {
    let cookie = await cookies();
    cookie.set({
        name: ADMIN_COOKIE_NAME,
        value: '',
        maxAge: 0,
        path: '/',
    });
}

export async function requireAdminAuth(options?: AdminAuthOptions) {
    const adminCount = await getCollection<AdminDocument>('admins').then((collection) => collection.countDocuments({}));
    if (adminCount === 0) {
        redirect('/login?error=admin-not-configured');
    }

    const authenticatedAdmin = await getAuthenticatedAdmin();
    if (!authenticatedAdmin) {
        redirect('/login');
    }

    const role = getAdminRole(authenticatedAdmin);
    if (options?.roles && !options.roles.includes(role)) {
        redirect(getDefaultManagePathForRole(role));
    }

    return authenticatedAdmin;
}

export async function getAuthenticatedAdmin(): Promise<AdminDocument | null> {
    const session = parseAdminSessionToken((await cookies()).get(ADMIN_COOKIE_NAME)?.value);
    if (!session) {
        return null;
    }

    return getAdminDocumentById(session.adminId);
}

export async function requireAdminApiAuth(options?: AdminAuthOptions): Promise<AdminDocument> {
    const admin = await getAuthenticatedAdmin();
    if (!admin) {
        throw new AppError(401, 'UNAUTHORIZED', { message: 'Unauthorized' });
    }

    const role = getAdminRole(admin);
    if (options?.roles && !options.roles.includes(role)) {
        throw new AppError(403, 'FORBIDDEN', { message: 'Insufficient permissions' });
    }

    return admin;
}

function getSessionSecret() {
    const secret = process.env.ADMIN_SESSION_SECRET;
    if (!secret) {
        throw new Error('ADMIN_SESSION_SECRET must be set to sign admin sessions');
    }
    return secret;
}

function signPayload(payload: string) {
    return createHmac('sha256', getSessionSecret()).update(payload).digest('hex');
}
enforceServerOnly('admin-auth');
