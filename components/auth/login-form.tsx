'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginForm() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const ERROR_MESSAGES: Record<string, string> = {
        'INVALID_CREDENTIALS': 'Invalid email or password. Please try again.',
        'SESSION_EXPIRED': 'Your session has expired. Please log in again.',
        'SESSION_REVOKED': 'Your session was revoked. Please log in again.',
        'EMAIL_ALREADY_EXISTS': 'This email is already registered.',
        'INTERNAL_SERVER_ERROR': 'Something went wrong on our end. Please try again later.',
    };

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const body = await res.json().catch(() => ({}));

            if (!res.ok) {
                const errorCode = body.code || body.error;
                const friendlyMessage = errorCode ? ERROR_MESSAGES[errorCode] : body.message;
                throw new Error(friendlyMessage || 'Login failed. Please check your credentials.');
            }

            // Redirect to home or refresh
            router.refresh();
            router.push('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred during sign in.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
                label="Email"
                type="email"
                placeholder="name@example.com"
                error={errors.email?.message}
                {...register('email')}
            />
            <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
            />

            {error && (
                <div className="text-sm text-black bg-red-50 p-2 rounded">
                    {error}
                </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
        </form>
    );
}
