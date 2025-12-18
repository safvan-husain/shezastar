'use server';

import { redirect } from 'next/navigation';

import {
    getAdminDocument,
    setAdminSessionCookie,
    verifyAdminPassword,
} from '@/lib/auth/admin-auth';

export async function adminLogin(_initialState: unknown, formData: FormData) {
    const password = formData.get('password');
    if (!password || typeof password !== 'string') {
        return { error: 'Password is required.' };
    }

    const admin = await getAdminDocument();
    if (!admin) {
        return { error: 'Admin user has not been configured yet.' };
    }

    if (!verifyAdminPassword(password, admin)) {
        return { error: 'Invalid password.' };
    }
    console.log('Admin logged in successfully.');

    await setAdminSessionCookie(admin._id.toString());
    redirect('/manage');
}
