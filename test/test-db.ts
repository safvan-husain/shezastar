import type { PrismaClient } from '@prisma/client';
import { prisma, resetMockDb } from './prisma-mock';

export async function startTestDB() {
    resetMockDb();
}

export async function getPrismaClient(): Promise<PrismaClient> {
    return prisma as unknown as PrismaClient;
}

export async function clearDatabase() {
    resetMockDb();
}

export async function stopTestDB() {
    await prisma.$disconnect();
}
