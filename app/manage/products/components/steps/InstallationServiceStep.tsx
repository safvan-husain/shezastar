// app/(admin)/products/components/steps/InstallationServiceStep.tsx
'use client';

import { Card } from '@/components/ui/Card';
import { InstallationLocation } from '@/lib/app-settings/app-settings.schema';
import { ProductInstallationLocation } from '@/lib/product/product.schema';

interface InstallationServiceStepProps {
    enabled: boolean;
    inStorePrice: string;
    atHomePrice: string;
    globalLocations: InstallationLocation[];
    availableLocations: ProductInstallationLocation[];
    onEnabledChange: (enabled: boolean) => void;
    onInStorePriceChange: (price: string) => void;
    onAtHomePriceChange: (price: string) => void;
    onAvailableLocationsChange: (locations: ProductInstallationLocation[]) => void;
}

export function InstallationServiceStep({
    enabled,
    inStorePrice,
    atHomePrice,
    globalLocations,
    availableLocations,
    onEnabledChange,
    onInStorePriceChange,
    onAtHomePriceChange,
    onAvailableLocationsChange,
}: InstallationServiceStepProps) {

    const handleLocationToggle = (globalLoc: InstallationLocation, isChecked: boolean) => {
        let newLocations = [...availableLocations];
        const existingIndex = newLocations.findIndex(l => l.locationId === globalLoc.id);

        if (isChecked) {
            if (existingIndex === -1) {
                // Add new
                newLocations.push({
                    locationId: globalLoc.id,
                    name: globalLoc.name,
                    priceDelta: globalLoc.priceDelta,
                    enabled: true,
                });
            } else {
                // Enable existing
                newLocations[existingIndex] = { ...newLocations[existingIndex], enabled: true };
            }
        } else {
            if (existingIndex !== -1) {
                // Disable existing
                newLocations[existingIndex] = { ...newLocations[existingIndex], enabled: false };
            }
        }
        onAvailableLocationsChange(newLocations);
    };

    const handleDeltaChange = (globalLoc: InstallationLocation, delta: number) => {
        let newLocations = [...availableLocations];
        const existingIndex = newLocations.findIndex(l => l.locationId === globalLoc.id);

        if (existingIndex !== -1) {
            newLocations[existingIndex] = { ...newLocations[existingIndex], priceDelta: delta };
        } else {
            // If trying to change delta for unchecked item, add it as disabled but with new delta?
            // We'll add it as disabled so the delta is preserved if they check it later
            newLocations.push({
                locationId: globalLoc.id,
                name: globalLoc.name,
                priceDelta: delta,
                enabled: false,
            });
        }
        onAvailableLocationsChange(newLocations);
    };

    return (
        <Card>
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-[var(--foreground)] mb-2">Installation Service</h2>
                    <p className="text-[var(--muted-foreground)]">
                        Configure installation service options for this product
                    </p>
                </div>

                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between p-4 bg-[var(--muted)]/30 rounded-lg border-2 border-[var(--border)]">
                    <div>
                        <label className="text-base font-semibold text-[var(--foreground)] block">
                            Offer Installation Service
                        </label>
                        <p className="text-sm text-[var(--muted-foreground)] mt-1">
                            Enable installation service for this product
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => onEnabledChange(!enabled)}
                        className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${enabled ? 'bg-[var(--primary)]' : 'bg-[var(--muted)]'
                            }`}
                    >
                        <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'
                                }`}
                        />
                    </button>
                </div>

                {/* Price Options - Only show when enabled */}
                {enabled && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="grid md:grid-cols-2 gap-4">
                            {/* In-Store Installation */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                                    <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    In-Store Installation Price
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] font-semibold">
                                        $
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={inStorePrice}
                                        onChange={(e) => onInStorePriceChange(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full pl-8 pr-4 py-3 bg-[var(--bg-subtle)] border-2 border-[var(--border-subtle)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all text-[var(--text-primary)]"
                                    />
                                </div>
                            </div>

                            {/* At-Home Installation */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                                    <svg className="w-5 h-5 text-[var(--primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                    </svg>
                                    At-Home Installation Base Price
                                </label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] font-semibold">
                                        $
                                    </span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={atHomePrice}
                                        onChange={(e) => onAtHomePriceChange(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full pl-8 pr-4 py-3 bg-[var(--background)] border-2 border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent transition-all text-[var(--foreground)]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Locations */}
                        <div className="border border-[var(--border-subtle)] rounded-lg overflow-hidden">
                            <div className="bg-[var(--bg-subtle)] px-4 py-3 border-b border-[var(--border-subtle)]">
                                <h3 className="font-semibold text-[var(--foreground)]">Available Locations & Overrides</h3>
                                <p className="text-sm text-[var(--muted-foreground)]">Select locations to offer at-home installation and adjust price deltas if needed.</p>
                            </div>
                            <div className="divide-y divide-[var(--border-subtle)]">
                                {globalLocations.map(loc => {
                                    const productLoc = availableLocations.find(l => l.locationId === loc.id);
                                    const isEnabled = productLoc?.enabled ?? false;
                                    const currentDelta = productLoc?.priceDelta ?? loc.priceDelta;

                                    return (
                                        <div key={loc.id} className="p-4 flex items-center gap-4 hover:bg-[var(--bg-base)] transition-colors">
                                            <label className="flex items-center gap-3 flex-1 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded border-[var(--border)] text-[var(--primary)] focus:ring-[var(--ring)]"
                                                    checked={isEnabled}
                                                    onChange={(e) => handleLocationToggle(loc, e.target.checked)}
                                                />
                                                <span className="font-medium text-[var(--foreground)]">{loc.name}</span>
                                            </label>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-[var(--muted-foreground)] whitespace-nowrap">Delta Price (+$):</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    className="w-24 px-2 py-1 border border-[var(--border-subtle)] rounded bg-[var(--background)] text-right"
                                                    value={currentDelta}
                                                    onChange={(e) => handleDeltaChange(loc, parseFloat(e.target.value) || 0)}
                                                // Disable delta input if location is not enabled? User said "even here can modify". So keep enabled.
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                {globalLocations.length === 0 && (
                                    <div className="p-4 text-center text-[var(--muted-foreground)]">
                                        No global installation locations configured. Go to Settings to add locations.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-[var(--bg-subtle)] border-2 border-[var(--border-subtle)] rounded-lg p-4 flex gap-3">
                            <svg className="w-5 h-5 text-[var(--text-secondary)] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="text-sm">
                                <p className="font-semibold text-[var(--text-primary)] mb-1">
                                    Installation Service Information
                                </p>
                                <p className="text-[var(--text-secondary)]">
                                    Customers will see the base "At-Home" price plus the specific location delta (e.g. ${atHomePrice || 0} + ${globalLocations[0]?.priceDelta || 0}).
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Disabled State Message */}
                {!enabled && (
                    <div className="text-center py-8 text-[var(--muted-foreground)]">
                        <svg className="w-16 h-16 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <p className="text-sm">
                            Installation service is disabled for this product
                        </p>
                    </div>
                )}
            </div>
        </Card>
    );
}
