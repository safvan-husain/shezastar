import { NextResponse } from 'next/server';
import { updateSubCategorySeo } from '@/lib/category/category.service';
import { revalidateCategoryCache } from '@/lib/category/category-cache';
import { CategorySeoUpdateSchema } from '@/lib/seo/admin-seo.schema';
import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { SEO_ADMIN_ROLES } from '@/lib/auth/admin-permissions';
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
    { params }: { params: Promise<{ categoryId: string; subId: string }> },
) {
    try {
        await requireAdminApiAuth({ roles: [...SEO_ADMIN_ROLES] });
        const { categoryId, subId } = await params;
        const body = await req.json();

        const parsed = CategorySeoUpdateSchema.parse({
            metaTitle: normalizeNullableString(body.metaTitle),
            metaDescription: normalizeNullableString(body.metaDescription),
            imagePath: normalizeNullableString(body.imagePath),
        });

        const category = await updateSubCategorySeo(categoryId, subId, parsed);
        revalidateCategoryCache();

        return NextResponse.json(category);
    } catch (error) {
        const { status, body } = catchError(error);
        return NextResponse.json(body, { status });
    }
}

export const PATCH = withRequestLogging(PATCHHandler);
