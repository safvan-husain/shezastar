import { ObjectId } from 'mongodb';
import { scryptSync, timingSafeEqual } from 'node:crypto';

export type AdminRole = 'super_admin' | 'seo_manager';

export interface AdminDocument {
    _id: ObjectId;
    email: string;
    displayName?: string;
    role: AdminRole;
    passwordHash: string;
    salt: string;
    createdAt: Date;
    updatedAt: Date;
}

export function hashAdminPassword(password: string, salt: string) {
    return scryptSync(password, salt, 64).toString('hex');
}

export function verifyAdminPassword(password: string, admin: AdminDocument) {
    const derived = scryptSync(password, admin.salt, 64);
    const stored = Buffer.from(admin.passwordHash, 'hex');
    if (derived.length !== stored.length) {
        return false;
    }
    return timingSafeEqual(derived, stored);
}
