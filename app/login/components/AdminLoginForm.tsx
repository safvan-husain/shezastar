'use client';

import { useActionState } from 'react';

import { adminLogin } from '@/app/actions/admin-login';

export default function AdminLoginForm() {
    const [state, action, pending] = useActionState(adminLogin, undefined);

    return (
        <form action={action} className="space-y-4">
            <div>
                <label htmlFor="email" className="block text-sm font-semibold">
                    Email
                </label>
                <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    required
                    placeholder="admin@example.com"
                    className="mt-1 w-full rounded-md border border-[var(--border-subtle)] bg-transparent px-3 py-2 text-sm focus:border-[var(--text-primary)] focus:outline-none"
                />
            </div>
            <div>
                <label htmlFor="password" className="block text-sm font-semibold">
                    Password
                </label>
                <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    placeholder="••••••••"
                    className="mt-1 w-full rounded-md border border-[var(--border-subtle)] bg-transparent px-3 py-2 text-sm focus:border-[var(--text-primary)] focus:outline-none"
                />
            </div>
            {state?.error && (
                <p className="text-sm text-red-500" role="alert">
                    {state.error}
                </p>
            )}
            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={pending}
                    className="inline-flex items-center justify-center rounded-md bg-[var(--text-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-inverted)] shadow-sm transition hover:bg-[var(--text-primary)]/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {pending ? 'Signing in…' : 'Sign in'}
                </button>
            </div>
        </form>
    );
}
