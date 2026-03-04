import { nanoid } from 'nanoid';
import { getCollection } from '@/lib/db/mongo-client';
import type { AppSettingsDocument } from '@/lib/app-settings/model/app-settings.model';
import { getDefaultSettings } from '@/lib/app-settings/model/app-settings.model';

const COLLECTION = 'appSettings';

const INITIAL_COUNTRIES = [
  {
    code: 'UAE',
    name: 'United Arab Emirates',
    defaultCurrency: 'AED',
    vatRatePercent: 5,
    vatIncludedInPrice: true,
    shippingChargeAed: 0,
    isActive: true,
  },
  {
    code: 'KSA',
    name: 'Saudi Arabia',
    defaultCurrency: 'SAR',
    vatRatePercent: 10,
    vatIncludedInPrice: false,
    shippingChargeAed: 80,
    isActive: true,
  },
  {
    code: 'KUWAIT',
    name: 'Kuwait',
    defaultCurrency: 'KWD',
    vatRatePercent: 0,
    vatIncludedInPrice: false,
    shippingChargeAed: 85,
    isActive: true,
  },
  {
    code: 'OMAN',
    name: 'Oman',
    defaultCurrency: 'OMR',
    vatRatePercent: 5,
    vatIncludedInPrice: false,
    shippingChargeAed: 80,
    isActive: true,
  },
  {
    code: 'QATAR',
    name: 'Qatar',
    defaultCurrency: 'QAR',
    vatRatePercent: 0,
    vatIncludedInPrice: false,
    shippingChargeAed: 80,
    isActive: true,
  },
  {
    code: 'BAHRAIN',
    name: 'Bahrain',
    defaultCurrency: 'BHD',
    vatRatePercent: 10,
    vatIncludedInPrice: false,
    shippingChargeAed: 65,
    isActive: true,
  },
] as const;

export async function seedCountries() {
  const collection = await getCollection<AppSettingsDocument>(COLLECTION);
  const now = new Date();
  const existing = await collection.findOne({});

  if (!existing) {
    const defaults = getDefaultSettings();
    await collection.insertOne({
      ...defaults,
      countryPricings: INITIAL_COUNTRIES.map((country) => ({ ...country, id: nanoid() })),
      createdAt: now,
      updatedAt: now,
    } as any);
    console.log(`Seeded ${INITIAL_COUNTRIES.length} countries into a new settings document.`);
    return;
  }

  const existingCountries = existing.countryPricings || [];
  const byCode = new Map(existingCountries.map((country) => [country.code.toUpperCase(), country]));

  const nextCountries = INITIAL_COUNTRIES.map((country) => {
    const found = byCode.get(country.code.toUpperCase());
    return {
      ...country,
      id: found?.id || nanoid(),
    };
  });

  await collection.updateOne(
    { _id: existing._id },
    {
      $set: {
        countryPricings: nextCountries,
        updatedAt: now,
      },
    }
  );

  console.log(`Upserted ${INITIAL_COUNTRIES.length} countries.`);
}

if (require.main === module) {
  seedCountries()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Failed to seed countries:', error);
      process.exit(1);
    });
}
