import { connectToDatabase } from '../lib/db/mongo-client';
import { loadEnvConfig } from '@next/env';
import path from 'path';

loadEnvConfig(process.cwd());

async function migrate() {
    console.log('Starting migration: Adding placeholder subtitles to products...');

    const { client, db } = await connectToDatabase();
    const productsCollection = db.collection('products');

    try {
        // Update all products that don't have a subtitle field
        const result = await productsCollection.updateMany(
            { subtitle: { $exists: false } },
            { $set: { subtitle: 'subtitle' } }
        );

        console.log(`Migration completed successfully.`);
        console.log(`${result.matchedCount} products matched the criteria.`);
        console.log(`${result.modifiedCount} products were updated.`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await client.close();
        process.exit(0);
    }
}

migrate();
