
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
        // Find all products to check for variants OR offer percentage update
        const cursor = productsCollection.find({});

        while (await cursor.hasNext()) {
            const product = await cursor.next();
            if (!product) continue;
            processed++;

            let hasChanges = false;
            const updateSet: any = {};

            // 1. Migrate Variant Prices (priceDelta -> price)
            if (product.variantStock && product.variantStock.length > 0) {
                let stockModified = false;
                const updatedStock = product.variantStock.map((entry: any) => {
                    if (typeof entry.price === 'number') {
                        if (entry.priceDelta !== undefined) {
                            const { priceDelta, ...rest } = entry;
                            stockModified = true;
                            return rest;
                        }
                        return entry;
                    }

                    if (entry.priceDelta !== undefined) {
                        stockModified = true;
                        const { priceDelta, ...rest } = entry;
                        return { ...rest, price: priceDelta };
                    }
                    return entry;
                });

                if (stockModified) {
                    updateSet.variantStock = updatedStock;
                    hasChanges = true;
                }
            }

            // 2. Migrate Offer Price -> Offer Percentage
            if (typeof product.basePrice === 'number' && product.basePrice > 0 && typeof product.offerPrice === 'number') {
                // Only calculate if offerPercentage is MISSING
                if (product.offerPercentage === undefined) {
                    const priceDiff = product.basePrice - product.offerPrice;
                    if (priceDiff > 0) {
                        const pct = Math.round((priceDiff / product.basePrice) * 100);
                        updateSet.offerPercentage = pct;
                        hasChanges = true;
                    } else {
                        // If offerPrice >= basePrice, percentage is 0.
                        if (priceDiff === 0) {
                            updateSet.offerPercentage = 0;
                            hasChanges = true;
                        }
                    }
                }
            }

            if (hasChanges) {
                await productsCollection.updateOne(
                    { _id: product._id },
                    { $set: updateSet }
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
