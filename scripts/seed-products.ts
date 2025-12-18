import { nanoid } from 'nanoid';
import { getCollection } from '@/lib/db/mongo-client';
import { createProduct } from '@/lib/product/product.service';
import { ProductDocument } from '@/lib/product/model/product.model';
import { electronicProductSeeds } from './product-seeding-data';

export async function seedProducts() {
    const collection = await getCollection<ProductDocument>('products');
    let createdCount = 0;
    for (const seed of electronicProductSeeds) {
        if (!seed.categoryId) {
            console.warn(`Skipping ${seed.name}; missing categoryId.`);
            continue;
        }

        const existing = await collection.findOne({ name: seed.name });
        if (existing) {
            console.log(`Product "${seed.name}" already exists. Skipping.`);
            continue;
        }

        const payload = {
            name: seed.name,
            subtitle: seed.description || seed.name, // Use description as subtitle, fallback to name
            description: seed.description,
            basePrice: seed.price,
            specifications: [], // Changed from highlights to specifications
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
            },
            variantStock: []
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
