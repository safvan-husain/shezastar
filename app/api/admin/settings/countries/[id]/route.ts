import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import {
  handleUpdateCountryPricing,
  handleRemoveCountryPricing,
} from '@/lib/app-settings/app-settings.controller';
import { revalidateCountryPricingsCache } from '@/lib/app-settings/app-settings-cache';
import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { SUPER_ADMIN_ROLES } from '@/lib/auth/admin-permissions';
import { withRequestLogging } from '@/lib/logging/request-logger';

async function PUTHandler(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await requireAdminApiAuth({ roles: [...SUPER_ADMIN_ROLES] });
    const payload = await req.json().catch(() => ({}));
    const { status, body } = await handleUpdateCountryPricing(id, payload);

    revalidatePath('/manage/settings/countries', 'page');
    revalidatePath('/(store)', 'layout');
    revalidateCountryPricingsCache();

    return NextResponse.json(body, { status });
  } catch (error: any) {
    if (error?.digest?.includes('NEXT_REDIRECT')) throw error;
    return NextResponse.json(
      { message: error?.message ?? 'Failed to update country pricing' },
      { status: error?.status ?? 500 }
    );
  }
}

async function DELETEHandler(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    await requireAdminApiAuth({ roles: [...SUPER_ADMIN_ROLES] });
    const { status, body } = await handleRemoveCountryPricing(id);

    revalidatePath('/manage/settings/countries', 'page');
    revalidatePath('/(store)', 'layout');
    revalidateCountryPricingsCache();

    return NextResponse.json(body, { status });
  } catch (error: any) {
    if (error?.digest?.includes('NEXT_REDIRECT')) throw error;
    return NextResponse.json(
      { message: error?.message ?? 'Failed to delete country pricing' },
      { status: error?.status ?? 500 }
    );
  }
}

export const PUT = withRequestLogging(PUTHandler);
export const DELETE = withRequestLogging(DELETEHandler);
