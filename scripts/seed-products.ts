import { nanoid } from 'nanoid';
import { getCollection } from '@/lib/db/mongo-client';
import { createProduct } from '@/lib/product/product.service';
import { ProductDocument } from '@/lib/product/model/product.model';
import { electronicProductSeeds } from './product-seeding-data';

async function seedProducts() {
    const collection = await getCollection<ProductDocument>('products');
    // const { deletedCount = 0 } = await collection.deleteMany({});
    // console.log(`Removed ${deletedCount} existing products.`);

    let createdCount = 0;
    for (const seed of electronicProductSeeds) {
        if (!seed.categoryId) {
            console.warn(`Skipping ${seed.name}; missing categoryId.`);
            continue;
        }

        const payload = {
            name: seed.name,
            description: seed.description,
            basePrice: seed.price,
            images: [
                {
                    id: nanoid(),
                    url: seed.image,
                    mappedVariants: [],
                    order: 0,
                },
            ],
            variants: [],
            subCategoryIds: [seed.categoryId],
            installationService: {
                enabled: false
            }
        };

        await createProduct(payload);
        createdCount += 1;
        console.log(`Created product ${seed.name}`);
    }

    console.log(`Seeded ${createdCount} products.`);
}

if (require.main === module) {
    seedProducts()
        .then(() => {
            console.log('Product seeding complete.');
            process.exit(0);
        })
        .catch(error => {
            console.error('Failed to seed products:', error);
            process.exit(1);
        });
}
