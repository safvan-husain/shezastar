import { seedCategories } from './seed-categories';
import { seedAdmin } from './seed-admin';
import { seedProducts } from './seed-products';
import { seedCountries } from './seed-countries';

async function main() {
    console.log('--- Starting Database Seeding ---');

    try {
        console.log('\n[1/3] Seeding Admin...');
        await seedAdmin();

        console.log('\n[2/3] Seeding Categories...');
        await seedCategories();

        console.log('\n[3/4] Seeding Countries...');
        await seedCountries();

        console.log('\n[4/4] Seeding Products...');
        await seedProducts();

        console.log('\n--- Seeding Completed Successfully ---');
        process.exit(0);
    } catch (error) {
        console.error('\n!!! Seeding Failed !!!');
        console.error(error);
        process.exit(1);
    }
}

main();
