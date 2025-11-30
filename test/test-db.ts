import { MongoMemoryServer } from 'mongodb-memory-server';
import type { PrismaClient } from '@prisma/client';

let mongoServer: MongoMemoryServer | null = null;
let prisma: PrismaClient | null = null;

export async function startTestDB() {
    mongoServer = await MongoMemoryServer.create();
    process.env.DATABASE_URL = mongoServer.getUri('testdb');

    if (!prisma) {
        const { prisma: client } = await import('@/lib/db/prisma');
        prisma = client;
    }
}

export async function getPrismaClient(): Promise<PrismaClient> {
    if (!prisma) {
        const { prisma: client } = await import('@/lib/db/prisma');
        prisma = client;
    }
    return prisma;
}

export async function clearDatabase() {
    const client = await getPrismaClient();
    await client.product.deleteMany();
    await client.category.deleteMany();
    await client.variantType.deleteMany();
}

export async function stopTestDB() {
    if (prisma) {
        await prisma.$disconnect();
    }
    if (mongoServer) {
        await mongoServer.stop();
    }
}
