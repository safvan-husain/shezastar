import RegisterForm from '@/components/auth/register-form';
import Link from 'next/link';

export default function RegisterPage() {
    return (
        <div className="flex h-full min-h-[60vh] items-center justify-center px-4 py-12 mt-24">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-black">
                        Create an account
                    </h1>
                    <p className="mt-2 text-sm text-black">
                        Already have an account?{' '}
                        <Link
                            href="/account"
                            className="font-medium text-black hover:text-black/80 transition-colors"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>

                <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-elevated)] p-8 shadow-sm">
                    <RegisterForm />
                </div>
            </div>
        </div>
    );
}
