import { cache } from 'react';
import { prisma } from '@/lib/db/prisma';

export const getCategories = cache(async () => {
    return prisma.category.findMany({ orderBy: { name: 'asc' } });
});

export const getCategoryById = cache(async (id: string) => {
    return prisma.category.findUnique({ where: { id } });
});
