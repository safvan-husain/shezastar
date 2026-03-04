'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import type { CountryPricing } from '@/lib/app-settings/app-settings.schema';
import { SUPPORTED_CURRENCIES } from '@/lib/currency/currency.config';

interface CountryPricingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: CountryPricing | null;
}

interface FormData {
  code: string;
  name: string;
  defaultCurrency: string;
  vatRatePercent: number;
  vatIncludedInPrice: boolean;
  shippingChargeAed: number;
  isActive: boolean;
}

const EMPTY_FORM: FormData = {
  code: '',
  name: '',
  defaultCurrency: 'AED',
  vatRatePercent: 0,
  vatIncludedInPrice: false,
  shippingChargeAed: 0,
  isActive: true,
};

export default function CountryPricingFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
}: CountryPricingFormModalProps) {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!initialData) {
      setFormData(EMPTY_FORM);
      return;
    }

    setFormData({
      code: initialData.code,
      name: initialData.name,
      defaultCurrency: initialData.defaultCurrency,
      vatRatePercent: initialData.vatRatePercent,
      vatIncludedInPrice: initialData.vatIncludedInPrice,
      shippingChargeAed: initialData.shippingChargeAed,
      isActive: initialData.isActive,
    });
  }, [initialData, isOpen]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);

    const url = initialData
      ? `/api/admin/settings/countries/${initialData.id}`
      : '/api/admin/settings/countries';
    const method = initialData ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
        }),
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        showToast(body.message || body.error || 'Failed to save country', 'error', {
          status: response.status,
          body,
          url,
          method,
        });
        return;
      }

      showToast(initialData ? 'Country updated' : 'Country created', 'success');
      onSuccess();
    } catch (error) {
      showToast('Failed to save country', 'error', {
        body: error,
        url,
        method,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Country' : 'Add Country'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Country Code</label>
            <input
              type="text"
              required
              maxLength={8}
              value={formData.code}
              onChange={(event) => setFormData((prev) => ({ ...prev, code: event.target.value }))}
              className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-base)] text-[var(--text-primary)]"
              placeholder="UAE"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Country Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
              className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-base)] text-[var(--text-primary)]"
              placeholder="United Arab Emirates"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Default Currency</label>
            <select
              required
              value={formData.defaultCurrency}
              onChange={(event) => setFormData((prev) => ({ ...prev, defaultCurrency: event.target.value }))}
              className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-base)] text-[var(--text-primary)]"
            >
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Shipping Charge (AED)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={formData.shippingChargeAed}
              onChange={(event) => setFormData((prev) => ({ ...prev, shippingChargeAed: Number(event.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-base)] text-[var(--text-primary)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">VAT Rate (%)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              required
              value={formData.vatRatePercent}
              onChange={(event) => setFormData((prev) => ({ ...prev, vatRatePercent: Number(event.target.value) || 0 }))}
              className="w-full px-3 py-2 border border-[var(--border-subtle)] rounded-md bg-[var(--bg-base)] text-[var(--text-primary)]"
            />
          </div>
          <div className="flex items-center gap-6 pt-7">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.vatIncludedInPrice}
                onChange={(event) => setFormData((prev) => ({ ...prev, vatIncludedInPrice: event.target.checked }))}
              />
              VAT included in price
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(event) => setFormData((prev) => ({ ...prev, isActive: event.target.checked }))}
              />
              Active
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : initialData ? 'Update Country' : 'Add Country'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
