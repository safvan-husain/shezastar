import LoginForm from '@/components/auth/login-form';
import Link from 'next/link';

export default function LoginPage() {
    return (
        <div className="flex h-full min-h-[60vh] items-center justify-center px-4 py-12">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-[var(--text-primary)]">
                        Sign in to your account
                    </h1>
                    <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        Or{' '}
                        <Link
                            href="/account/register"
                            className="font-medium text-[var(--primary)] hover:text-[var(--primary)]/80 transition-colors"
                        >
                            create a new account
                        </Link>
                    </p>
                </div>

                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-8 shadow-sm">
                    <LoginForm />
                </div>
            </div>
        </div>
    );
}
