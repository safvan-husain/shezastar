import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { getCollection } from '@/lib/db/mongo-client';

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

export async function migrateAdminRoles() {
    const collection = await getCollection('admins');
    const fallbackEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const admins = await collection.find({}).sort({ createdAt: 1 }).toArray();

    if (admins.length === 0) {
        console.log('No admin accounts found. Nothing to migrate.');
        return;
    }

    let updatedCount = 0;

    for (const [index, admin] of admins.entries()) {
        const update: Record<string, string> = {};

        if (!admin.role) {
            update.role = index === 0 ? 'super_admin' : 'seo_manager';
        }

        if (!admin.email) {
            if (index === 0 && fallbackEmail) {
                const emailTaken = await collection.findOne({
                    email: fallbackEmail,
                    _id: { $ne: admin._id },
                });
                if (emailTaken) {
                    console.warn(`Skipping admin ${admin._id.toString()} because ADMIN_EMAIL is already assigned to another account.`);
                    continue;
                }
                update.email = fallbackEmail;
            } else {
                console.warn(`Skipping admin ${admin._id.toString()} because email is missing and no fallback is available.`);
                continue;
            }
        }

        if (Object.keys(update).length === 0) {
            continue;
        }

        await collection.updateOne(
            { _id: admin._id },
            {
                $set: {
                    ...update,
                    updatedAt: new Date(),
                },
            },
        );
        updatedCount += 1;
    }

    if (updatedCount === 0) {
        console.log('All admin accounts already have role and email. Nothing to migrate.');
        return;
    }

    console.log(`Migrated ${updatedCount} admin account(s).`);
}

if (require.main === module) {
    migrateAdminRoles()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Failed to migrate admin roles:', error);
            process.exit(1);
        });
}
