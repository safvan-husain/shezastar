import { cache } from 'react';
import { prisma } from '@/lib/db/prisma';

export const getProducts = cache(async (page = 1, limit = 20) => {
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
});

export const getProductById = cache(async (id: string) => {
    return prisma.product.findUnique({ where: { id } });
});
