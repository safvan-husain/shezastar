import { NextResponse } from 'next/server';
import { revalidateProductCache } from '@/lib/product/product-cache';
import { updateProductSeo } from '@/lib/product/product.service';
import { ProductSeoUpdateSchema } from '@/lib/seo/admin-seo.schema';
import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { SEO_ADMIN_ROLES } from '@/lib/auth/admin-permissions';
import { buildAdminActivityActor } from '@/lib/activity/activity.service';
import { catchError } from '@/lib/errors/app-error';
import { withRequestLogging } from '@/lib/logging/request-logger';

function normalizeNullableString(value: unknown) {
    if (value === null) {
        return null;
    }
    if (typeof value !== 'string') {
        return undefined;
    }
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

async function PATCHHandler(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const admin = await requireAdminApiAuth({ roles: [...SEO_ADMIN_ROLES] });
        const actor = buildAdminActivityActor(admin);
        const { id } = await params;
        const body = await req.json();

        const parsed = ProductSeoUpdateSchema.parse({
            metaTitle: normalizeNullableString(body.metaTitle),
            metaDescription: normalizeNullableString(body.metaDescription),
        });

        const product = await updateProductSeo(id, parsed, actor);
        revalidateProductCache(id);

        return NextResponse.json(product);
    } catch (error) {
        const { status, body } = catchError(error);
        return NextResponse.json(body, { status });
    }
}

export const PATCH = withRequestLogging(PATCHHandler);
