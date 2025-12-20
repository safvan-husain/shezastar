'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

const registerSchema = z
    .object({
        email: z.string().email('Invalid email address'),
        password: z.string().min(8, 'Password must be at least 8 characters'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ['confirmPassword'],
    });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterForm() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const ERROR_MESSAGES: Record<string, string> = {
        'EMAIL_ALREADY_EXISTS': 'This email is already registered. Please sign in instead.',
        'WEAK_PASSWORD': 'Password is too weak. Please use a stronger password.',
        'INVALID_EMAIL': 'Please enter a valid email address.',
        'INTERNAL_SERVER_ERROR': 'Something went wrong on our end. Please try again later.',
    };

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: data.email,
                    password: data.password,
                }),
            });

            const body = await res.json().catch(() => ({}));

            if (!res.ok) {
                const errorCode = body.code || body.error;
                const friendlyMessage = errorCode ? ERROR_MESSAGES[errorCode] : body.message;
                throw new Error(friendlyMessage || 'Registration failed. Please try again.');
            }

            // Redirect to home or refresh (auto-login assumed)
            router.refresh();
            router.push('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred during registration.');
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
            <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
            />

            {error && (
                <div className="text-sm text-[var(--danger)] bg-red-50 p-2 rounded">
                    {error}
                </div>
            )}

            <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
        </form>
    );
}
