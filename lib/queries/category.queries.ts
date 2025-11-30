import { cache } from 'react';
import { prisma } from '@/lib/db/prisma';

export const getCategories = cache(async () => {
    return prisma.category.findMany({ orderBy: { name: 'asc' } });
});
