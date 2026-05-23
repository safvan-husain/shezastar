import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { getCollection } from '@/lib/db/mongo-client';
import { hashAdminPassword } from '@/lib/auth/admin-auth-core';

loadDotenv();

function loadDotenv() {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!existsSync(envPath)) {
        return;
    }

    const contents = readFileSync(envPath, 'utf8');
    for (const rawLine of contents.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) {
            continue;
        }

        const equalsIndex = line.indexOf('=');
        if (equalsIndex === -1) {
            continue;
        }

        const key = line.slice(0, equalsIndex).trim();
        let value = line.slice(equalsIndex + 1).trim();

        if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1);
        }

        if (!(key in process.env)) {
            process.env[key] = value;
        }
    }
}

export async function seedSeoAdmin() {
    const password = process.env.SEO_ADMIN_PASSWORD;
    const email = process.env.SEO_ADMIN_EMAIL?.trim().toLowerCase();
    if (!password || !email) {
        console.log('SEO_ADMIN_EMAIL or SEO_ADMIN_PASSWORD not set. Skipping SEO admin seeding.');
        return;
    }
    const displayName = process.env.SEO_ADMIN_DISPLAY_NAME?.trim() || 'SEO Manager';

    const collection = await getCollection('admins');
    const existingAdmin = await collection.findOne({ email });
    if (existingAdmin) {
        console.log('SEO admin already exists for this email. Skipping SEO admin seeding.');
        return;
    }

    const existingSeoManager = await collection.findOne({ role: 'seo_manager' });
    if (existingSeoManager) {
        console.log('SEO manager account already exists. Skipping SEO admin seeding.');
        return;
    }

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashAdminPassword(password, salt);
    const now = new Date();

    await collection.insertOne({
        email,
        displayName,
        role: 'seo_manager',
        passwordHash,
        salt,
        createdAt: now,
        updatedAt: now,
    });

    console.log('SEO admin user seeded successfully.');
}

if (require.main === module) {
    seedSeoAdmin()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Failed to seed SEO admin user:', error);
            process.exit(1);
        });
}
