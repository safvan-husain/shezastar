import { NextResponse } from 'next/server';
import { handleGetShipmentLabel } from '@/lib/shipping/shipping.controller';
import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { catchError } from '@/lib/errors/app-error';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function GETHandler(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        await requireAdminApiAuth();
        const { id } = await params;
        const result = await handleGetShipmentLabel(id);

        if (result.status !== 200 || !result.body) {
            return NextResponse.json(result.body, { status: result.status });
        }

        return new NextResponse(result.body, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="label-${id}.pdf"`,
            },
        });
    } catch (error) {
        const handled = catchError(error);
        return NextResponse.json(handled.body, { status: handled.status });
    }
}

export const GET = withRequestLogging(GETHandler);
