import { migrateAdminRoles } from './migrate-admin-roles';
import { seedCategories } from './seed-categories';
import { seedAdmin } from './seed-admin';
import { seedSeoAdmin } from './seed-seo-admin';
import { seedProducts } from './seed-products';
import { seedCountries } from './seed-countries';

async function main() {
    console.log('--- Starting Database Seeding ---');

    try {
        console.log('\n[1/6] Migrating admin roles...');
        await migrateAdminRoles();

        console.log('\n[2/6] Seeding super admin...');
        await seedAdmin();

        console.log('\n[3/6] Seeding SEO manager...');
        await seedSeoAdmin();

        console.log('\n[4/6] Seeding categories...');
        await seedCategories();

        console.log('\n[5/6] Seeding countries...');
        await seedCountries();

        console.log('\n[6/6] Seeding products...');
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
