import { NextResponse } from 'next/server';
import { handleGetActiveCountryPricings } from '@/lib/app-settings/app-settings.controller';

export async function GET() {
  const { status, body } = await handleGetActiveCountryPricings();
  return NextResponse.json(body, {
    status,
    headers: {
      'x-request-method': 'GET',
    },
  });
}
