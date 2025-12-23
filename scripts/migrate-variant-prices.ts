
import { connectToDatabase } from '../lib/db/mongo-client';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

async function migrate() {
    console.log('Starting migration: Converting variant priceDelta to absolute price...');

    const { client, db } = await connectToDatabase();
    const productsCollection = db.collection('products');

    // Counters
    let processed = 0;
    let modified = 0;

    try {
        // Find products that have non-empty variantStock
        const cursor = productsCollection.find({
            variantStock: { $not: { $size: 0 } }
        });

        while (await cursor.hasNext()) {
            const product = await cursor.next();
            if (!product || !product.variantStock) continue;
            processed++;

            let hasChanges = false;
            // Iterate over variantStock to migrate priceDelta -> price
            const updatedStock = product.variantStock.map((entry: any) => {
                // Case 1: Price is already set (Migration likely run previously or data is new)
                if (typeof entry.price === 'number') {
                    // Cleanup: If priceDelta still exists, remove it.
                    if (entry.priceDelta !== undefined) {
                        const { priceDelta, ...rest } = entry;
                        hasChanges = true;
                        return rest;
                    }
                    return entry;
                }

                // Case 2: Price is NOT set, but priceDelta exists (Legacy/Bad Data)
                // As per user, priceDelta currently holds the "Full Price" for these records.
                if (entry.priceDelta !== undefined) {
                    hasChanges = true;
                    // Move delta value to price field, remove delta field.
                    const { priceDelta, ...rest } = entry;
                    return {
                        ...rest,
                        price: priceDelta
                    };
                }

                return entry;
            });

            if (hasChanges) {
                await productsCollection.updateOne(
                    { _id: product._id },
                    { $set: { variantStock: updatedStock } }
                );
                modified++;
            }
        }

        console.log(`Migration completed.`);
        console.log(`Checked ${processed} products.`);
        console.log(`Modified ${modified} products.`);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await client.close();
        process.exit(0);
    }
}

migrate();
