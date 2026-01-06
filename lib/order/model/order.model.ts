import { ObjectId } from '@/lib/db/mongo-client';
import type { BillingDetails } from '@/lib/billing-details/billing-details.schema';
import type { InstallationOption } from '@/lib/cart/cart.schema';

export type OrderStatus = 'pending' | 'paid' | 'cancelled' | 'failed' | 'completed';

export interface OrderItemDocument {
    productId: string;
    productName: string;
    productImage?: string;
    variantName?: string;
    selectedVariantItemIds: string[];
    quantity: number;
    unitPrice: number;
    installationOption?: InstallationOption;
    installationAddOnPrice?: number;
    installationLocationId?: string;
    installationLocationName?: string;
    installationLocationDelta?: number;
}

export interface OrderDocument {
    _id: ObjectId;
    sessionId: string;
    paymentProvider?: 'stripe' | 'tabby';
    paymentProviderSessionId?: string;
    paymentProviderOrderId?: string;
    stripeSessionId?: string;
    items: OrderItemDocument[];
    totalAmount: number;
    currency: string;
    status: OrderStatus;
    billingDetails?: BillingDetails;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderItem {
    productId: string;
    productName: string;
    productImage?: string;
    variantName?: string;
    selectedVariantItemIds: string[];
    quantity: number;
    unitPrice: number;
    installationOption: InstallationOption;
    installationAddOnPrice: number;
    installationLocationId?: string;
    installationLocationName?: string;
    installationLocationDelta?: number;
}

export interface Order {
    id: string;
    sessionId: string;
    paymentProvider?: 'stripe' | 'tabby';
    paymentProviderSessionId?: string;
    paymentProviderOrderId?: string;
    stripeSessionId?: string;
    items: OrderItem[];
    totalAmount: number;
    currency: string;
    status: OrderStatus;
    billingDetails?: BillingDetails;
    createdAt: string;
    updatedAt: string;
}

export function toOrder(doc: OrderDocument): Order {
    return {
        id: doc._id.toHexString(),
        sessionId: doc.sessionId,
        paymentProvider: doc.paymentProvider,
        paymentProviderSessionId: doc.paymentProviderSessionId,
        paymentProviderOrderId: doc.paymentProviderOrderId,
        stripeSessionId: doc.stripeSessionId,
        items: doc.items.map(item => ({
            productId: item.productId,
            productName: item.productName,
            productImage: item.productImage,
            variantName: item.variantName,
            selectedVariantItemIds: item.selectedVariantItemIds,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            installationOption: item.installationOption ?? 'none',
            installationAddOnPrice: item.installationAddOnPrice ?? 0,
            installationLocationId: item.installationLocationId,
            installationLocationName: item.installationLocationName,
            installationLocationDelta: item.installationLocationDelta,
        })),
        totalAmount: doc.totalAmount,
        currency: doc.currency,
        status: doc.status,
        billingDetails: doc.billingDetails,
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    };
}
