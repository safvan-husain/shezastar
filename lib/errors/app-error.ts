// lib/errors/app-error.ts
import { ZodError } from 'zod';

export class AppError extends Error {
    constructor(
        public status: number,
        public code: string,
        public details?: any
    ) {
        super(code);
        this.name = 'AppError';
    }
}

export function catchError(err: unknown): { status: number; body: any } {
    if (err instanceof AppError) {
        return {
            status: err.status,
            body: {
                error: err.code,
                details: err.details,
            },
        };
    }

    if (err instanceof ZodError) {
        return {
            status: 400,
            body: {
                error: 'VALIDATION_ERROR',
                details: err.errors,
            },
        };
    }

    if (err instanceof Error) {
        return {
            status: 500,
            body: {
                error: 'INTERNAL_SERVER_ERROR',
                message: err.message,
            },
        };
    }

    return {
        status: 500,
        body: {
            error: 'UNKNOWN_ERROR',
        },
    };
}
