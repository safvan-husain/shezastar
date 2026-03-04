import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  handleGetCountryPricings,
  handleCreateCountryPricing,
} from '@/lib/app-settings/app-settings.controller';
import { requireAdminAuth } from '@/lib/auth/admin-auth';

export async function GET() {
  try {
    await requireAdminAuth();
    const { status, body } = await handleGetCountryPricings();
    return NextResponse.json(body, { status });
  } catch (error: any) {
    if (error?.digest?.includes('NEXT_REDIRECT')) throw error;
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminAuth();
    const payload = await req.json().catch(() => ({}));
    const { status, body } = await handleCreateCountryPricing(payload);

    revalidatePath('/manage/settings/countries', 'page');
    revalidatePath('/(store)', 'layout');

    return NextResponse.json(body, { status });
  } catch (error: any) {
    if (error?.digest?.includes('NEXT_REDIRECT')) throw error;
    return NextResponse.json(
      { message: error?.message ?? 'Failed to create country pricing' },
      { status: error?.status ?? 500 }
    );
  }
}
