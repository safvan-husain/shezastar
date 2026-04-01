import { NextResponse } from 'next/server';
import { handleGetActiveCountryPricings } from '@/lib/app-settings/app-settings.controller';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function GETHandler(_req: Request) {
  const { status, body } = await handleGetActiveCountryPricings();
  return NextResponse.json(body, {
    status,
    headers: {
      'x-request-method': 'GET',
    },
  });
}

export const GET = withRequestLogging(GETHandler);
