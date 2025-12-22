import { ObjectId } from '@/lib/db/mongo-client';
import type { BillingDetails } from '@/lib/billing-details/billing-details.schema';
import type { InstallationOption } from '@/lib/cart/cart.schema';

export interface CartItemDocument {
    productId: string;
    /**
     * Normalized set of variant item ids (sorted, deduplicated).
     * Represents the concrete variant combination for this line.
     */
    selectedVariantItemIds: string[];
    quantity: number;
    /**
     * Snapshot of the effective unit price for this variant combination
     * at the time it was last updated.
     */
    unitPrice: number;
    installationOption?: InstallationOption;
    installationAddOnPrice?: number;
    installationLocationId?: string;
    installationLocationDelta?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface CartDocument {
    _id: ObjectId;
    sessionId: string;
    userId?: ObjectId;
    items: CartItemDocument[];
    billingDetails?: BillingDetails;
    createdAt: Date;
    updatedAt: Date;
}

export interface CartItem {
    productId: string;
    selectedVariantItemIds: string[];
    quantity: number;
    unitPrice: number;
    installationOption: InstallationOption;
    installationAddOnPrice: number;
    installationLocationId?: string;
    installationLocationDelta?: number;
    createdAt: string;
    updatedAt: string;
}

export interface Cart {
    id: string;
    sessionId: string;
    userId?: string;
    items: CartItem[];
    billingDetails?: BillingDetails;
    subtotal: number;
    totalItems: number;
    createdAt: string;
    updatedAt: string;
}

export function computeCartTotals(items: CartItemDocument[]): { subtotal: number; totalItems: number } {
    return items.reduce(
        (acc, item) => {
            acc.subtotal += item.unitPrice * item.quantity;
            acc.totalItems += item.quantity;
            return acc;
        },
        { subtotal: 0, totalItems: 0 }
    );
}

export function toCart(doc: CartDocument): Cart {
    const { subtotal, totalItems } = computeCartTotals(doc.items);

    return {
        id: doc._id.toHexString(),
        sessionId: doc.sessionId,
        userId: doc.userId?.toHexString(),
        items: doc.items.map(item => ({
            productId: item.productId,
            selectedVariantItemIds: item.selectedVariantItemIds,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            installationOption: item.installationOption ?? 'none',
            installationAddOnPrice: item.installationAddOnPrice ?? 0,
            installationLocationId: item.installationLocationId,
            installationLocationDelta: item.installationLocationDelta,
            createdAt: item.createdAt.toISOString(),
            updatedAt: item.updatedAt.toISOString(),
        })),
        billingDetails: doc.billingDetails,
        subtotal,
        totalItems,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    };
}

