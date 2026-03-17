import Link from 'next/link';
import { getCountryPricings } from '@/lib/app-settings/app-settings.service';
import CountryPricingList from './components/CountryPricingList';

// export const dynamic = 'force-dynamic';

export default async function CountriesSettingsPage() {
  const countries = await getCountryPricings();

  return (
    <div className="container mx-auto px-4 py-8">
      <Link
        href="/manage/settings"
        className="mb-4 inline-block text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        ← Back to Settings
      </Link>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Countries & Taxes</h1>
        <p className="text-[var(--text-secondary)]">
          Configure country-wise VAT and shipping charges. Shipping values are entered in AED.
        </p>
      </div>

      <CountryPricingList initialCountries={countries} />
    </div>
  );
}
