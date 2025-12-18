import { connectToDatabase } from '../lib/db/mongo-client';
import { loadEnvConfig } from '@next/env';
import path from 'path';

loadEnvConfig(process.cwd());

async function migrate() {
    console.log('Starting migration: Refactoring highlights to specifications...');

    const { client, db } = await connectToDatabase();
    const productsCollection = db.collection('products');

    try {
        // Find products that have highlights
        const products = await productsCollection.find({
            highlights: { $exists: true, $not: { $size: 0 } }
        }).toArray();

        console.log(`Found ${products.length} products with highlights.`);

        for (const product of products) {
            const highlights = product.highlights;
            const existingSpecs = product.specifications || [];

            // Add highlights as a new section
            const newSpec = {
                title: 'Key Features',
                items: highlights
            };

            await productsCollection.updateOne(
                { _id: product._id },
                {
                    $push: { specifications: newSpec },
                    $unset: { highlights: "" }
                }
            );
        }

        // Final cleanup for anyone with empty highlights array
        const result = await productsCollection.updateMany(
            { highlights: { $exists: true } },
            { $unset: { highlights: "" } }
        );

        console.log(`Migration completed successfully.`);
        console.log(`${result.modifiedCount} products were cleaned up (empty highlights).`);

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await client.close();
        process.exit(0);
    }
}

migrate();
