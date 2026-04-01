import { NextRequest, NextResponse } from 'next/server';
import { handleSmsaTrackingWebhook } from '@/lib/shipping/shipping.controller';
import { withRequestLogging } from '@/lib/logging/request-logger';

function unauthorizedWebhookResponse() {
    return NextResponse.json(
        {
            code: 'UNAUTHORIZED_WEBHOOK',
            error: 'UNAUTHORIZED_WEBHOOK',
            message: 'Invalid SMSA webhook secret.',
        },
        { status: 401 },
    );
}

async function POSTHandler(req: NextRequest) {
    const configuredSecret = process.env.CUSTOM_SECRET || process.env.SHIPPING_CUSTOM_SECRET;
    if (configuredSecret) {
        const incomingSecret = req.headers.get('custom-secret');
        if (!incomingSecret || incomingSecret !== configuredSecret) {
            return unauthorizedWebhookResponse();
        }
    }

    let payload: unknown;
    try {
        payload = await req.json();
    } catch {
        return NextResponse.json(
            {
                code: 'INVALID_JSON',
                error: 'INVALID_JSON',
                message: 'Request body must be valid JSON.',
            },
            { status: 400 },
        );
    }

    const { status, body } = await handleSmsaTrackingWebhook(payload);
    return NextResponse.json(body, { status });
}

export const POST = withRequestLogging(POSTHandler);
