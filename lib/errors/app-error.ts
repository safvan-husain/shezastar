import { ZodError } from 'zod';

export type AppErrorPayload = {
    status: number;
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
};

type AppErrorInit =
    | {
          message?: string;
          details?: Record<string, any>;
      }
    | Record<string, any>
    | undefined;

export class AppError extends Error {
    public status: number;
    public code: string;
    public details?: Record<string, any>;
    public timestamp: string;

    constructor(status: number, code: string, init?: AppErrorInit) {
        const base = init && typeof init === 'object' && !Array.isArray(init) ? init : undefined;
        const message = typeof base?.message === 'string' ? base.message : code;
        super(message);

        this.name = 'AppError';
        this.status = status;
        this.code = code;
        this.timestamp = new Date().toISOString();

        if (base) {
            if ('details' in base && base.details) {
                this.details = base.details as Record<string, any>;
            } else {
                const { message: _message, ...rest } = base as Record<string, any>;
                this.details = Object.keys(rest).length ? rest : undefined;
            }
        }

        Object.setPrototypeOf(this, AppError.prototype);
    }

    toJSON(): AppErrorPayload {
        return {
            status: this.status,
            code: this.code,
            message: this.message,
            details: this.details,
            timestamp: this.timestamp,
        };
    }
}

export function catchError(err: unknown): { status: number; body: AppErrorPayload } {
    if (err instanceof AppError) {
        return { status: err.status, body: err.toJSON() };
    }

    if (err instanceof ZodError) {
        const timestamp = new Date().toISOString();
        return {
            status: 400,
            body: {
                status: 400,
                code: 'VALIDATION_ERROR',
                message: 'Validation failed',
                details: { issues: err.issues },
                timestamp,
            },
        };
    }

    const timestamp = new Date().toISOString();
    return {
        status: 500,
        body: {
            status: 500,
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred',
            details: {
                originalError: err instanceof Error ? err.message : String(err),
                stack: err instanceof Error && process.env.NODE_ENV === 'development' ? err.stack : undefined,
            },
            timestamp,
        },
    };
}
