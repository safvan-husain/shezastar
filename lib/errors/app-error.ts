// lib/errors/app-error.ts
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
