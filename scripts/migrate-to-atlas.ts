// import { loadEnvConfig } from '@next/env';
import 'dotenv/config';

import { MongoClient, Collection, Document, AnyBulkWriteOperation } from 'mongodb';
import { executeWithLogging, runSeeder, type SeedContext } from './seed/seed-utils';

// loadEnvConfig(process.cwd());

const BATCH_SIZE = 500;

function resolveDbName(uriValue: string, envVar?: string): string {
    try {
        const url = new URL(uriValue);
        const pathname = url.pathname.replace(/^\//, '').split('?')[0].trim();

        if (pathname) {
            return decodeURIComponent(pathname);
        }
    } catch (e) {
        // Fallback to env vars if URL parsing fails
    }

    const fallback =
        process.env.MONGODB_DATABASE?.trim() ||
        process.env.DB_NAME?.trim();

    if (fallback) {
        return fallback;
    }

    throw new Error(
        `Could not determine database name from ${envVar || 'URI'}. Include it in the URI path or set MONGODB_DATABASE/DB_NAME.`
    );
}

async function flushBatch(
    ctx: SeedContext,
    collectionName: string,
    targetCollection: Collection<Document>,
    batch: Document[],
    batchNumber: number
): Promise<number> {
    if (batch.length === 0) {
        return 0;
    }

    const operations: AnyBulkWriteOperation<Document>[] = batch.map(document => ({
        replaceOne: {
            filter: { _id: document._id },
            replacement: document,
            upsert: true,
        },
    }));

    await executeWithLogging(
        ctx,
        targetCollection.bulkWrite.bind(targetCollection),
        [operations, { ordered: false }],
        {
            formatLog: () =>
                `Collection ${collectionName}: applying batch #${batchNumber} (${batch.length} docs)`,
        }
    );

    return batch.length;
}

async function migrateCollection(
    ctx: SeedContext,
    sourceClient: MongoClient,
    targetClient: MongoClient,
    dbName: string,
    collectionName: string
): Promise<number> {
    const sourceCollection = sourceClient.db(dbName).collection<Document>(collectionName);
    const targetCollection = targetClient.db(dbName).collection<Document>(collectionName);

    const sourceCount = await sourceCollection.countDocuments({});

    if (sourceCount === 0) {
        console.log(`Collection ${collectionName}: nothing to copy.`);
        return 0;
    }

    console.log(`\nCollection ${collectionName}: ${sourceCount} source documents`);

    let migratedCount = 0;
    let batch: Document[] = [];
    let batchNumber = 0;

    const cursor = sourceCollection.find({});

    for await (const document of cursor) {
        batch.push(document);

        if (batch.length >= BATCH_SIZE) {
            batchNumber += 1;
            const flushed = await flushBatch(
                ctx,
                collectionName,
                targetCollection,
                batch,
                batchNumber
            );
            migratedCount += flushed ?? batch.length; // Handle dry run returning undefined
            batch = [];
        }
    }

    if (batch.length > 0) {
        batchNumber += 1;
        const flushed = await flushBatch(
            ctx,
            collectionName,
            targetCollection,
            batch,
            batchNumber
        );
        migratedCount += flushed ?? batch.length;
    }

    console.log(`Collection ${collectionName}: copied ${migratedCount} documents.`);
    return migratedCount;
}

async function migrateToAtlas(ctx: SeedContext) {
    const sourceUri = process.env.MONGODB_URI?.trim();
    const targetUri = process.env.MONGODB_URI_NEW?.trim();

    if (!sourceUri) {
        throw new Error('Missing MONGODB_URI in environment.');
    }

    if (!targetUri) {
        throw new Error('Missing MONGODB_URI_NEW in environment.');
    }

    const dbName = resolveDbName(sourceUri, 'MONGODB_URI');
    const targetDbName = resolveDbName(targetUri, 'MONGODB_URI_NEW');

    console.log(`Source Database: ${dbName}`);
    console.log(`Target Database: ${targetDbName}`);

    const sourceClient = new MongoClient(sourceUri);
    const targetClient = new MongoClient(targetUri);

    await sourceClient.connect();
    await targetClient.connect();

    try {
        const collections = await sourceClient
            .db(dbName)
            .listCollections({}, { nameOnly: true })
            .toArray();

        const collectionNames = collections
            .map(collection => collection.name)
            .filter(name => !name.startsWith('system.'));

        console.log(`Found ${collectionNames.length} collections in ${dbName}.`);

        let totalMigrated = 0;

        for (const collectionName of collectionNames) {
            totalMigrated += await migrateCollection(
                ctx,
                sourceClient,
                targetClient,
                dbName,
                collectionName
            );
        }

        console.log(`\nMigration summary: copied ${totalMigrated} documents across ${collectionNames.length} collections.`);
    } finally {
        await sourceClient.close();
        await targetClient.close();
    }
}

runSeeder('Migration to Atlas', migrateToAtlas);
