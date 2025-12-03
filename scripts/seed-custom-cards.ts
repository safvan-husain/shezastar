import { getCollection } from '@/lib/db/mongo-client';
import { AppSettingsDocument } from '@/lib/app-settings/model/app-settings.model';
import { CustomCards } from '@/lib/app-settings/app-settings.schema';

const CUSTOM_CARD_SEEDS: CustomCards = {
    card1: {
        title: 'Quantum Mesh Network',
        subtitle: 'Adaptive nodes delivering resilient, multi-path connectivity.',
        imagePath: '/uploads/custom-card-quantum-net.jpg',
        offerLabel: 'Launch offer',
        urlLink: 'https://example.com/quantum-mesh',
    },
    card2: {
        title: 'Digital Horizon Studio',
        subtitle: 'Immersive visualization lab for product storytellers.',
        imagePath: '/uploads/custom-card-digital-horizon.jpg',
        offerLabel: 'Tour studio',
        urlLink: 'https://example.com/digital-horizon',
    },
    card3: {
        title: 'Abstract Circuit Forge',
        subtitle: 'Blueprints and fabrication kits for next-gen hardware.',
        imagePath: '/uploads/custom-card-abstract-circuit.jpg',
        offerLabel: 'View kits',
        urlLink: 'https://example.com/abstract-circuit',
    },
    card4: {
        title: 'AI Orbit Command',
        subtitle: 'Autonomous orchestration for distributed systems.',
        imagePath: '/uploads/custom-card-ai-orbit.jpg',
        offerLabel: 'See AI tools',
        urlLink: 'https://example.com/ai-orbit',
    },
    card5: {
        title: 'Crypto Grid Lab',
        subtitle: 'Secure rails and analytics for decentralized finance.',
        imagePath: '/uploads/custom-card-crypto-grid.jpg',
        offerLabel: 'Explore protocols',
        urlLink: 'https://example.com/crypto-grid',
    },
    card6: {
        title: 'Automation Wireframe',
        subtitle: 'Workflow blueprints that reduce manual handoffs.',
        imagePath: '/uploads/custom-card-automation-wire.jpg',
        offerLabel: 'Download guide',
        urlLink: 'https://example.com/automation-wire',
    },
};

const COLLECTION_NAME = 'appSettings';

export async function seedCustomCards() {
    const collection = await getCollection<AppSettingsDocument>(COLLECTION_NAME);
    const now = new Date();

    await collection.updateOne(
        {},
        {
            $set: {
                customCards: CUSTOM_CARD_SEEDS,
                updatedAt: now,
            },
            $setOnInsert: {
                createdAt: now,
                homeHeroBanners: [],
            },
        },
        {
            upsert: true,
        }
    );

    console.log('Seeded 6 custom cards.');
}

if (require.main === module) {
    seedCustomCards()
        .then(() => {
            console.log('Custom card seeding complete.');
            process.exit(0);
        })
        .catch(error => {
            console.error('Failed to seed custom cards:', error);
            process.exit(1);
        });
}
