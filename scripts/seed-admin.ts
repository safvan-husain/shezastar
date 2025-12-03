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

async function seedAdmin() {
    const password = process.env.ADMIN_PASSWORD;
    if (!password) {
        throw new Error('ADMIN_PASSWORD environment variable must be set before seeding the admin');
    }

    const collection = await getCollection('admins');
    await collection.deleteMany({});

    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashAdminPassword(password, salt);
    const now = new Date();

    await collection.insertOne({
        passwordHash,
        salt,
        createdAt: now,
        updatedAt: now,
    });

    console.log('Admin user seeded successfully.');
}

if (require.main === module) {
    seedAdmin()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Failed to seed admin user:', error);
            process.exit(1);
        });
}
