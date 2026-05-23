'use server';

import { redirect } from 'next/navigation';

import {
    getAdminByEmail,
    getDefaultManagePathForRole,
    getAdminRole,
    setAdminSessionCookie,
    verifyAdminPassword,
} from '@/lib/auth/admin-auth';
import { getCollection } from '@/lib/db/mongo-client';

export async function adminLogin(_initialState: unknown, formData: FormData) {
    const email = formData.get('email');
    const password = formData.get('password');

    if (!email || typeof email !== 'string' || !email.trim()) {
        return { error: 'Email is required.' };
    }

    if (!password || typeof password !== 'string') {
        return { error: 'Password is required.' };
    }

    const adminCount = await getCollection('admins').then((collection) => collection.countDocuments({}));
    if (adminCount === 0) {
        return { error: 'Admin user has not been configured yet.' };
    }

    const admin = await getAdminByEmail(email);
    if (!admin || !verifyAdminPassword(password, admin)) {
        return { error: 'Invalid email or password.' };
    }

    await setAdminSessionCookie(admin._id.toString());
    redirect(getDefaultManagePathForRole(getAdminRole(admin)));
}
