import { nanoid } from 'nanoid';
import { prisma } from '@/lib/db/prisma';
import { AppError } from '@/lib/errors/app-error';
import {
    CreateProductInput,
    UpdateProductInput,
    ProductImageInput,
} from '@/lib/validations/product.schema';

function ensureOfferPrice(basePrice: number, offerPrice?: number | null) {
    if (offerPrice && offerPrice >= basePrice) {
        throw new AppError(400, 'INVALID_OFFER_PRICE', {
            message: 'Offer price must be less than base price',
        });
    }
}

function normalizeImages(images: ProductImageInput[] = []) {
    return images.map((img, index) => ({
        ...img,
        id: img.id || nanoid(),
        mappedVariants: img.mappedVariants || [],
        order: img.order ?? index,
    }));
}

export async function createProduct(input: CreateProductInput) {
    ensureOfferPrice(input.basePrice, input.offerPrice);

    const images = normalizeImages(input.images);

    const created = await prisma.product.create({
        data: {
            name: input.name,
            description: input.description,
            basePrice: input.basePrice,
            offerPrice: input.offerPrice,
            images,
            variants: input.variants,
            subCategoryIds: input.subCategoryIds,
            installationService: input.installationService,
        },
    });

    return created;
}

export async function updateProduct(id: string, input: UpdateProductInput) {
    const existing = await prisma.product.findUnique({ where: { id } });

    if (!existing) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND');
    }

    const basePrice = input.basePrice ?? existing.basePrice;
    const offerPrice = input.offerPrice ?? existing.offerPrice;
    ensureOfferPrice(basePrice, offerPrice ?? undefined);

    const images = input.images ? normalizeImages(input.images) : undefined;

    const updated = await prisma.product.update({
        where: { id },
        data: {
            name: input.name ?? existing.name,
            description: input.description ?? existing.description,
            basePrice,
            offerPrice,
            images,
            variants: input.variants ?? existing.variants,
            subCategoryIds: input.subCategoryIds ?? existing.subCategoryIds,
            installationService: input.installationService ?? existing.installationService,
        },
    });

    return updated;
}

export async function deleteProduct(id: string) {
    const existing = await prisma.product.findUnique({ where: { id } });

    if (!existing) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND');
    }

    await prisma.product.delete({ where: { id } });

    return { success: true } as const;
}

export async function getProductById(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });

    if (!product) {
        throw new AppError(404, 'PRODUCT_NOT_FOUND');
    }

    return product;
}

export async function listProducts(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
        prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
            skip,
            take: limit,
        }),
        prisma.product.count(),
    ]);

    return {
        products,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
    };
}
