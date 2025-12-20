import LoginForm from '@/components/auth/login-form';
import Link from 'next/link';

export default function LoginPage() {
    return (
        <div className="flex h-full min-h-[60vh] items-center justify-center px-4 py-12">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-black">
                        Sign in to your account
                    </h1>
                    <p className="mt-2 text-sm text-black">
                        Or{' '}
                        <Link
                            href="/account/register"
                            className="font-medium text-black hover:text-black/80 transition-colors"
                        >
                            create a new account
                        </Link>
                    </p>
                </div>

                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-4 sm:p-6 shadow-sm">
                    <LoginForm />
                </div>
            </div>
        </div>
    );
}
