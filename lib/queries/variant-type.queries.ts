import { cache } from 'react';
import { prisma } from '@/lib/db/prisma';

export const getVariantTypes = cache(async () => {
    return prisma.variantType.findMany({ orderBy: { name: 'asc' } });
});

export const getVariantType = cache(async (id: string) => {
    return prisma.variantType.findUnique({ where: { id } });
});
