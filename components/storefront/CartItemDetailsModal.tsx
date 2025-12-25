'use client';

import Image from "next/image";
import { Modal } from "@/components/ui/Modal";
import type { CartItem } from "@/lib/cart/model/cart.model";
import type { Product } from "@/lib/product/model/product.model";
import { useCurrency } from "@/lib/currency/CurrencyContext";
import { stripHtml } from "@/lib/utils/string.utils";

interface CartItemDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: CartItem;
    product: Product | null;
}

export function CartItemDetailsModal({ isOpen, onClose, item, product }: CartItemDetailsModalProps) {
    const { formatPrice } = useCurrency();

    if (!product) return null;

    const imageUrl = product.images?.[0]?.url;
    const productBasePrice = item.unitPrice - item.installationAddOnPrice;
    const lineTotal = item.unitPrice * item.quantity;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Item Details" containerClassName="max-w-xl">
            <div className="space-y-6">
                {/* Product Header */}
                <div className="flex gap-4 items-start">
                    <div className="w-24 h-24 relative flex-shrink-0 rounded-lg overflow-hidden bg-[var(--storefront-bg-subtle)] border border-[var(--storefront-border-light)]">
                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={product.name}
                                fill
                                sizes="96px"
                                unoptimized
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center text-[var(--storefront-text-muted)] text-xs">
                                No image
                            </div>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-[var(--storefront-text-primary)] leading-snug">
                            {product.name}
                        </h3>
                        <p className="text-sm text-[var(--storefront-text-secondary)] mt-1 line-clamp-2">
                            {stripHtml(product.description || '')}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Configuration Details */}
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-xs font-bold text-[var(--storefront-text-muted)] uppercase tracking-wider mb-2">
                                Configuration
                            </h4>
                            <div className="bg-[var(--storefront-bg-subtle)] rounded-lg p-3 space-y-2 border border-[var(--storefront-border-light)]">
                                {product.variants?.map(variant => {
                                    const selectedItemId = item.selectedVariantItemIds.find(id =>
                                        variant.selectedItems.some(opt => opt.id === id)
                                    );
                                    const selectedItem = variant.selectedItems.find(opt => opt.id === selectedItemId);

                                    if (!selectedItem) return null;

                                    return (
                                        <div key={variant.variantTypeId} className="flex justify-between text-sm">
                                            <span className="text-[var(--storefront-text-secondary)]">{variant.variantTypeName}:</span>
                                            <span className="font-medium text-[var(--storefront-text-primary)]">{selectedItem.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {item.installationOption && item.installationOption !== 'none' && (
                            <div>
                                <h4 className="text-xs font-bold text-[var(--storefront-text-muted)] uppercase tracking-wider mb-2">
                                    Installation
                                </h4>
                                <div className="bg-[var(--storefront-bg-subtle)] rounded-lg p-3 space-y-2 border border-[var(--storefront-border-light)]">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--storefront-text-secondary)]">Type:</span>
                                        <span className="font-medium text-[var(--storefront-text-primary)]">
                                            {item.installationOption === 'store' ? 'At Store' : 'At Home'}
                                        </span>
                                    </div>
                                    {item.installationOption === 'home' && item.installationLocationId && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-[var(--storefront-text-secondary)]">Location:</span>
                                            <span className="font-medium text-[var(--storefront-text-primary)]">
                                                {product.installationService?.availableLocations?.find(l => l.locationId === item.installationLocationId)?.name || 'Standard'}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm pt-1 border-t border-[var(--storefront-border-light)]">
                                        <span className="text-[var(--storefront-text-secondary)]">Add-on Price:</span>
                                        <span className="font-medium text-[var(--storefront-text-primary)]">
                                            +{formatPrice(item.installationAddOnPrice)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pricing breakdown */}
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-xs font-bold text-[var(--storefront-text-muted)] uppercase tracking-wider mb-2">
                                Price Breakdown
                            </h4>
                            <div className="bg-[var(--storefront-bg-subtle)] rounded-lg p-3 space-y-2 border border-[var(--storefront-border-light)]">
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--storefront-text-secondary)]">Unit Price:</span>
                                    <span className="text-[var(--storefront-text-primary)]">{formatPrice(productBasePrice)}</span>
                                </div>
                                {item.installationOption !== 'none' && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-[var(--storefront-text-secondary)]">Installation:</span>
                                        <span className="text-[var(--storefront-text-primary)]">+{formatPrice(item.installationAddOnPrice)}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-sm pt-1 border-t border-[var(--storefront-border-light)] font-bold">
                                    <span className="text-[var(--storefront-text-primary)]">Final Unit:</span>
                                    <span className="text-[var(--storefront-text-primary)]">{formatPrice(item.unitPrice)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-[var(--storefront-text-secondary)]">Quantity:</span>
                                    <span className="text-[var(--storefront-text-primary)]">x {item.quantity}</span>
                                </div>
                                <div className="flex justify-between text-lg pt-2 border-t border-[var(--storefront-border-light)] font-bold">
                                    <span className="text-[var(--storefront-text-primary)]">Total:</span>
                                    <span className="text-[var(--storefront-text-primary)]">{formatPrice(lineTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-[var(--storefront-border-light)] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 rounded-lg bg-[var(--storefront-button-primary)] text-white font-semibold hover:bg-[var(--storefront-button-primary-hover)] transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </Modal>
    );
}
