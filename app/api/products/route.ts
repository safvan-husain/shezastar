// app/api/products/route.ts
import { NextResponse } from 'next/server';
import {
    handleGetAllProducts,
    handleCreateProduct,
} from '@/lib/product/product.controller';
import { saveImages } from '@/lib/utils/file-upload';
import { nanoid } from 'nanoid';
import { searchProducts } from '@/lib/product/product.service';
import { resolveCategoryFilter } from '@/lib/product/product.service';
import { requireAdminApiAuth } from '@/lib/auth/admin-auth';
import { buildAdminActivityActor } from '@/lib/activity/activity.service';
import { catchError } from '@/lib/errors/app-error';

function withNoStoreHeaders(headers?: HeadersInit) {
    return {
        'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
        Pragma: 'no-cache',
        ...headers,
    };
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search');

    // If search query is provided, use search endpoint
    if (search) {
        try {
            const products = await searchProducts(search, 100); // Get more results for search
            const total = products.length;
            const skip = (page - 1) * limit;
            const paginatedProducts = products.slice(skip, skip + limit);

            return NextResponse.json({
                products: paginatedProducts,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            }, { headers: withNoStoreHeaders() });
        } catch (error: any) {
            return NextResponse.json(
                { error: error.message || 'Failed to search products' },
                { status: 500, headers: withNoStoreHeaders() }
            );
        }
    }

    // Support multiple categoryId parameters
    const categoryIds = searchParams.getAll('categoryId');
    const legacySubCategoryId = searchParams.get('subCategoryId');

    const finalCategoryIds = categoryIds.length > 0
        ? categoryIds
        : (legacySubCategoryId ? [legacySubCategoryId] : undefined);

    const originId = searchParams.get('originId') || undefined;
    let resolvedFilter = null;
    try {
        resolvedFilter = await resolveCategoryFilter(finalCategoryIds);
    } catch {
        // Diagnostics must not change the route's normal error semantics.
    }

    const { status, body } = await handleGetAllProducts(page, limit, finalCategoryIds, originId);
    return NextResponse.json(body, {
        status,
        headers: withNoStoreHeaders(
            resolvedFilter
                ? {
                    'X-Catalog-Category-Requested': resolvedFilter.requestedIds.join(','),
                    'X-Catalog-Category-Match-Count': String(resolvedFilter.hierarchyIds.length),
                }
                : undefined
        ),
    });
}

export async function POST(req: Request) {
    try {
        const admin = await requireAdminApiAuth();
        const actor = buildAdminActivityActor(admin);
        const contentType = req.headers.get('content-type');

        // Support both JSON (used by tests) and multipart/form-data (used by the app)
        if (contentType?.includes('multipart/form-data')) {
            const formData = await req.formData();

            // Extract basic product data
            const name = formData.get('name') as string;
            const subtitle = formData.get('subtitle') as string;
            const description = formData.get('description') as string | null;
            const basePrice = parseFloat(formData.get('basePrice') as string);
            const offerPercentage = formData.get('offerPercentage') ? parseFloat(formData.get('offerPercentage') as string) : undefined;
            const specifications = formData.get('specifications')
                ? JSON.parse(formData.get('specifications') as string)
                : undefined;
            const variants = JSON.parse(formData.get('variants') as string || '[]');
            const variantStock = JSON.parse(formData.get('variantStock') as string || '[]');
            const subCategoryIds = JSON.parse(formData.get('subCategoryIds') as string || '[]');
            const installationService = formData.get('installationService') ? JSON.parse(formData.get('installationService') as string) : undefined;
            const existingImages = JSON.parse(formData.get('existingImages') as string || '[]');
            const brandId = (formData.get('brandId') as string) || undefined;

            // Handle new image uploads
            const newImagesCount = parseInt(formData.get('newImagesCount') as string || '0');
            const newImageFiles = formData.getAll('newImages') as File[];

            let uploadedImages: any[] = [];
            if (newImageFiles.length > 0) {
                const urls = await saveImages(newImageFiles);

                // Map uploaded URLs with metadata
                uploadedImages = urls.map((url, index) => {
                    const metaStr = formData.get(`newImageMeta_${index}`) as string;
                    const meta = metaStr ? JSON.parse(metaStr) : {};

                    return {
                        id: nanoid(),
                        url,
                        mappedVariants: meta.mappedVariants || [],
                        order: meta.order ?? (existingImages.length + index),
                    };
                });
            }

            // Combine existing and new images
            const allImages = [...existingImages, ...uploadedImages];

            const productData = {
                name,
                subtitle,
                description,
                basePrice,
                offerPercentage,
                specifications,
                images: allImages,
                variants,
                variantStock,
                subCategoryIds,
                installationService,
                brandId,
            };

            const { status, body } = await handleCreateProduct(productData, actor);
            return NextResponse.json(body, { status });
        }

        const jsonData = await req.json();
        const { status, body } = await handleCreateProduct(jsonData, actor);
        return NextResponse.json(body, { status });
    } catch (error: any) {
        const handled = catchError(error);
        if (handled.status !== 500 || error?.code === 'UNAUTHORIZED') {
            return NextResponse.json(handled.body, { status: handled.status });
        }
        return NextResponse.json(
            { error: error.message || 'Failed to create product' },
            { status: 500 }
        );
    }
}
