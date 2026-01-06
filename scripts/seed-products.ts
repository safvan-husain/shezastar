import { getCollection } from '../lib/db/mongo-client';
import { createProduct } from '../lib/product/product.service';
import { ProductDocument } from '../lib/product/model/product.model';

export async function seedProducts() {
    // 1. Check if we are in development environment
    if (process.env.NODE_ENV !== 'development') {
        console.log('Environment is not development. Skipping product seeding.');
        return;
    }

    // 2. Check if products already exist
    const collection = await getCollection<ProductDocument>('products');
    const productCount = await collection.countDocuments();

    if (productCount > 0) {
        console.log('Products already exist. Skipping product seeding.');
        return;
    }

    console.log('Starting product seeding (Development)...');

    // 3. Insert 2 products with minimalist data
    const products = [
        {
            name: 'Minimalist Chair',
            basePrice: 120.00,
            description: 'A sleek, minimalist chair for your modern home.',
            subCategoryIds: [],
            images: [],
            variants: [],
            variantStock: [],
            specifications: []
        },
        {
            name: 'Essential Desk Lamp',
            basePrice: 45.50,
            description: 'Simple and functional desk lamp with adjustable brightness.',
            subCategoryIds: [],
            images: [],
            variants: [],
            variantStock: [],
            specifications: []
        }
    ];

    for (const product of products) {
        await createProduct(product as any);
        console.log(`Created product: ${product.name}`);
    }

    console.log(`Successfully seeded ${products.length} products.`);
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
