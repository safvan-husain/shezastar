import { seedCategories } from './seed-categories';
import { seedAdmin } from './seed-admin';
import { seedProducts } from './seed-products';
import { seedCustomCards } from './seed-custom-cards';

async function main() {
    console.log('--- Starting Database Seeding ---');

    try {
        console.log('\n[1/4] Seeding Admin...');
        await seedAdmin();

        console.log('\n[2/4] Seeding Categories...');
        await seedCategories();

        console.log('\n[3/4] Seeding Products...');
        await seedProducts();

        console.log('\n[4/4] Seeding Custom Cards...');
        await seedCustomCards();

        console.log('\n--- Seeding Completed Successfully ---');
        process.exit(0);
    } catch (error) {
        console.error('\n!!! Seeding Failed !!!');
        console.error(error);
        process.exit(1);
    }
}

main();
