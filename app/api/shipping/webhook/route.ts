import { NextRequest, NextResponse } from 'next/server';
import { handleSmsaTrackingWebhook } from '@/lib/shipping/shipping.controller';
import { logger } from '@/lib/logging/logger';
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
    const webhookRequestId = req.headers.get('x-request-id') ?? crypto.randomUUID();
    const logMeta = {
        webhookRequestId,
        pathname: '/api/shipping/webhook',
    };

    await logger.debug('SMSA webhook: request received', {
        ...logMeta,
        method: req.method,
        secretConfigured: Boolean(process.env.CUSTOM_SECRET || process.env.SHIPPING_CUSTOM_SECRET),
        hasCustomSecretHeader: Boolean(req.headers.get('custom-secret')),
    });

    const configuredSecret = process.env.CUSTOM_SECRET || process.env.SHIPPING_CUSTOM_SECRET;
    if (configuredSecret) {
        const incomingSecret = req.headers.get('custom-secret');
        if (!incomingSecret || incomingSecret !== configuredSecret) {
            await logger.error('SMSA webhook: secret validation failed', {
                ...logMeta,
                hasIncomingSecret: Boolean(incomingSecret),
            });
            return unauthorizedWebhookResponse();
        }

        await logger.debug('SMSA webhook: secret validation passed', logMeta);
    }

    let payload: unknown;
    try {
        await logger.debug('SMSA webhook: parsing request body', logMeta);
        payload = await req.json();
        await logger.log('SMSA webhook: request body parsed', {
            ...logMeta,
            details: payload,
        });
    } catch {
        await logger.error('SMSA webhook: invalid JSON body', logMeta);
        return NextResponse.json(
            {
                code: 'INVALID_JSON',
                error: 'INVALID_JSON',
                message: 'Request body must be valid JSON.',
            },
            { status: 400 },
        );
    }

    await logger.debug('SMSA webhook: handing off to controller', logMeta);
    const { status, body } = await handleSmsaTrackingWebhook(payload, { webhookRequestId });
    await logger.log('SMSA webhook: controller completed', {
        ...logMeta,
        status,
        details: body,
    });
    return NextResponse.json(body, { status });
}

export const POST = withRequestLogging(POSTHandler);
