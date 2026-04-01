import 'server-only';

import { logger, type LogMeta } from '@/lib/logging/logger';

type RequestHandler<TArgs extends [Request, ...unknown[]]> = (
    ...args: TArgs
) => Response | Promise<Response>;

function buildRequestMeta(request: Request, requestId: string): LogMeta {
    const url = new URL(request.url);
    const query = url.searchParams.toString();

    return {
        requestId,
        method: request.method,
        pathname: url.pathname,
        query: query || undefined,
    };
}

export function withRequestLogging<TArgs extends [Request, ...unknown[]]>(
    handler: RequestHandler<TArgs>
) {
    return async (...args: TArgs): Promise<Response> => {
        const [request] = args;
        const startedAt = performance.now();
        const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
        const requestMeta = buildRequestMeta(request, requestId);

        await logger.debug('Incoming request', requestMeta);

        try {
            const response = await handler(...args);
            const durationMs = Number((performance.now() - startedAt).toFixed(2));

            await logger.log('Request completed', {
                ...requestMeta,
                status: response.status,
                durationMs,
            });

            return response;
        } catch (error) {
            const durationMs = Number((performance.now() - startedAt).toFixed(2));
            const normalizedError = error instanceof Error ? error : new Error(String(error));

            await logger.error('Request failed', {
                ...requestMeta,
                durationMs,
                errorMessage: normalizedError.message,
                errorStack: normalizedError.stack,
                details: error instanceof Error ? undefined : error,
            });

            throw error;
        }
    };
}
