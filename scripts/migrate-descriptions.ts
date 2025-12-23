import { connectToDatabase, getCollection } from '../lib/db/mongo-client';
import { ProductDocument } from '../lib/product/model/product.model';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

async function migrateDescriptions() {
    console.log('Starting migration of product descriptions...');
    const { client } = await connectToDatabase();

    try {
        const collection = await getCollection<ProductDocument>('products');
        const products = await collection.find({}).toArray();
        console.log(`Found ${products.length} products.`);

        let updatedCount = 0;

        for (const product of products) {
            const desc = product.description;
            if (desc) {
                // simple check for HTML tags
                if (!/<[a-z][\s\S]*>/i.test(desc)) {
                    console.log(`Migrating description for product: ${product.name}`);
                    const newDesc = desc.split('\n')
                        .filter(line => line.trim())
                        .map(line => `<p>${line}</p>`)
                        .join('');

                    await collection.updateOne(
                        { _id: product._id },
                        { $set: { description: newDesc } }
                    );
                    updatedCount++;
                }
            }
        }

        console.log(`Migration complete. Updated ${updatedCount} products.`);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await client.close();
        process.exit(0);
    }
}

migrateDescriptions();
