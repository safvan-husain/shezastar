import { seedCategories } from './seed-categories';
import { seedAdmin } from './seed-admin';

async function main() {
    console.log('--- Starting Database Seeding ---');

    try {
        console.log('\n[1/2] Seeding Admin...');
        await seedAdmin();

        console.log('\n[2/2] Seeding Categories...');
        await seedCategories();

        console.log('\n--- Seeding Completed Successfully ---');
        process.exit(0);
    } catch (error) {
        console.error('\n!!! Seeding Failed !!!');
        console.error(error);
        process.exit(1);
    }
}

main();
