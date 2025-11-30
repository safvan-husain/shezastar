import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';
import type { PrismaClient } from '@prisma/client';

let mongoClient: MongoClient | null = null;
let prisma: PrismaClient | null = null;
let testDbName: string | null = null;

function buildTestDatabaseUrl() {
    const baseUrl = process.env.DATABASE_URL ?? process.env.MONGODB_URI;
    if (!baseUrl) {
        throw new Error('DATABASE_URL or MONGODB_URI must be set to run tests against a real MongoDB instance.');
    }

    const url = new URL(baseUrl);
    const baseNameFromUrl = url.pathname.replace(/^\//, '');
    const baseName = (process.env.DB_NAME || baseNameFromUrl || 'test-db').trim() || 'test-db';

    testDbName = `${baseName}-test-${randomUUID()}`;
    url.pathname = `/${testDbName}`;

    return url.toString();
}

export async function startTestDB() {
    const testDbUrl = buildTestDatabaseUrl();
    process.env.DATABASE_URL = testDbUrl;

    mongoClient = new MongoClient(testDbUrl);
    await mongoClient.connect();

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
    if (!mongoClient || !testDbName) return;

    const db = mongoClient.db(testDbName);
    await db.dropDatabase();
}

export async function stopTestDB() {
    if (prisma) {
        await prisma.$disconnect();
    }
    if (mongoClient && testDbName) {
        const db = mongoClient.db(testDbName);
        await db.dropDatabase();
        await mongoClient.close();
    }
    mongoClient = null;
    prisma = null;
    testDbName = null;
}
