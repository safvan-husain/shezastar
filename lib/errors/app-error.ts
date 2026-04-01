// lib/errors/app-error.ts
import 'server-only';

import { ZodError } from 'zod';
import { logger } from '@/lib/logging/logger';

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
                code: err.code,
                error: err.code,
                message: err.details?.message || err.message,
                details: err.details,
            },
        };
    }

    if (err instanceof ZodError) {
        return {
            status: 400,
            body: {
                code: 'VALIDATION_ERROR',
                error: 'VALIDATION_ERROR',
                details: err.errors,
            },
        };
    }

    if (err instanceof Error) {
        void logger.error('Unhandled application error', {
            errorMessage: err.message,
            errorStack: err.stack,
        });

        return {
            status: 500,
            body: {
                code: 'INTERNAL_SERVER_ERROR',
                error: 'INTERNAL_SERVER_ERROR',
                message: err.message,
            },
        };
    }

    void logger.error('Unhandled non-error application failure', {
        details: err,
    });

    return {
        status: 500,
        body: {
            code: 'UNKNOWN_ERROR',
            error: 'UNKNOWN_ERROR',
        },
    };
}
