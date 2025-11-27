// lib/utils/api-error-handler.ts

export interface ApiErrorDetails {
    status: number;
    body: any;
    url: string;
    method: string;
}

export async function handleApiError(
    response: Response,
    showToast: (message: string, type: 'error', details?: any) => void
): Promise<never> {
    let body;
    try {
        body = await response.json();
    } catch {
        body = { error: 'Failed to parse error response' };
    }

    const details: ApiErrorDetails = {
        status: response.status,
        body,
        url: response.url,
        method: response.headers.get('x-request-method') || 'UNKNOWN',
    };

    const message = body.message || body.error || `Request failed with status ${response.status}`;
    
    showToast(message, 'error', details);
    
    throw new Error(message);
}
