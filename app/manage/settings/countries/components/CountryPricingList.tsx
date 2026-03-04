'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';
import type { CountryPricing } from '@/lib/app-settings/app-settings.schema';
import CountryPricingFormModal from './CountryPricingFormModal';

interface CountryPricingListProps {
  initialCountries: CountryPricing[];
}

export default function CountryPricingList({ initialCountries }: CountryPricingListProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [countries, setCountries] = useState(initialCountries);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCountry, setEditingCountry] = useState<CountryPricing | null>(null);
  const [confirmingCountry, setConfirmingCountry] = useState<CountryPricing | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isFormOpen) {
      setCountries(initialCountries);
    }
  }, [initialCountries, isFormOpen]);

  const handleDelete = async () => {
    if (!confirmingCountry) return;

    const url = `/api/admin/settings/countries/${confirmingCountry.id}`;
    const method = 'DELETE';
    setDeletingId(confirmingCountry.id);

    try {
      const response = await fetch(url, { method });
      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        showToast(body.message || body.error || 'Failed to remove country', 'error', {
          status: response.status,
          body,
          url,
          method,
        });
        return;
      }

      showToast('Country removed', 'success');
      setCountries((prev) => prev.filter((country) => country.id !== confirmingCountry.id));
      setConfirmingCountry(null);
      router.refresh();
    } catch (error) {
      showToast('Failed to remove country', 'error', {
        body: error,
        url,
        method,
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Button onClick={() => {
          setEditingCountry(null);
          setIsFormOpen(true);
        }}>
          + Add Country
        </Button>
      </div>

      {countries.length === 0 ? (
        <div className="text-center py-12 bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)]">
          <p className="text-[var(--text-secondary)] mb-4">No countries configured</p>
          <Button onClick={() => setIsFormOpen(true)}>Add your first country</Button>
        </div>
      ) : (
        <div className="bg-[var(--bg-elevated)] rounded-lg border border-[var(--border-subtle)] overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)]">
                <th className="p-4 font-semibold text-[var(--text-secondary)]">Code</th>
                <th className="p-4 font-semibold text-[var(--text-secondary)]">Country</th>
                <th className="p-4 font-semibold text-[var(--text-secondary)]">Currency</th>
                <th className="p-4 font-semibold text-[var(--text-secondary)]">VAT</th>
                <th className="p-4 font-semibold text-[var(--text-secondary)]">Shipping (AED)</th>
                <th className="p-4 font-semibold text-[var(--text-secondary)]">Status</th>
                <th className="p-4 font-semibold text-[var(--text-secondary)] text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {countries.map((country) => (
                <tr key={country.id} className="border-b border-[var(--border-subtle)] last:border-0">
                  <td className="p-4 font-mono text-sm">{country.code}</td>
                  <td className="p-4">{country.name}</td>
                  <td className="p-4">{country.defaultCurrency}</td>
                  <td className="p-4">
                    {country.vatRatePercent}% {country.vatIncludedInPrice ? '(included)' : '(add-on)'}
                  </td>
                  <td className="p-4">{country.shippingChargeAed.toFixed(2)}</td>
                  <td className="p-4">{country.isActive ? 'Active' : 'Inactive'}</td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingCountry(country);
                          setIsFormOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => setConfirmingCountry(country)}>
                        Remove
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CountryPricingFormModal
        isOpen={isFormOpen}
        initialData={editingCountry}
        onClose={() => setIsFormOpen(false)}
        onSuccess={() => {
          setIsFormOpen(false);
          router.refresh();
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(confirmingCountry)}
        onClose={() => setConfirmingCountry(null)}
        onConfirm={handleDelete}
        title="Remove Country"
        message={`Are you sure you want to remove "${confirmingCountry?.name}"?`}
        confirmText="Remove"
        variant="danger"
        isLoading={Boolean(deletingId)}
      />
    </div>
  );
}
