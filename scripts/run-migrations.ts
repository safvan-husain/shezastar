
import { execSync } from 'child_process';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd());

const migrations = [
    'scripts/migrate-variant-prices.ts',
    'scripts/migrate-descriptions.ts'
];

console.log('🚀 Starting database migrations...');

for (const script of migrations) {
    try {
        console.log(`\n▶ Running migration: ${script}`);
        // Inherit stdio to show output from the child script in the main console
        execSync(`npx tsx ${script}`, { stdio: 'inherit' });
        console.log(`✅ ${script} completed successfully.`);
    } catch (error) {
        console.error(`❌ Migration failed: ${script}`);
        // Stop the migration process if one fails
        process.exit(1);
    }
}

console.log('\n✨ All migrations completed successfully.');
