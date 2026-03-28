import { ObjectId } from '@/lib/db/mongo-client';
import type { BillingDetails } from '@/lib/billing-details/billing-details.schema';
import type { InstallationOption } from '@/lib/cart/cart.schema';

export type OrderStatus =
    | 'pending'
    | 'paid'
    | 'requested_shipment'
    | 'shipped'
    | 'cancellation_requested'
    | 'cancellation_approved'
    | 'return_requested'
    | 'return_approved'
    | 'refund_approved'
    | 'refunded'
    | 'cancelled'
    | 'refund_failed'
    | 'failed'
    | string;

export type OrderCancellationDecision = 'pending' | 'approved' | 'rejected';

export interface OrderCancellationDocument {
    requestedAt?: Date;
    approvedAt?: Date;
    completedAt?: Date;
    rejectedAt?: Date;
    requestReason?: string;
    adminDecision?: OrderCancellationDecision;
    adminNote?: string;
    requestedBySessionId?: string;
    requestedByUserId?: ObjectId;
}

export type OrderReturnDecision = 'pending' | 'approved' | 'rejected';

export interface OrderReturnDocument {
    requestedAt?: Date;
    approvedAt?: Date;
    completedAt?: Date;
    rejectedAt?: Date;
    requestReason?: string;
    adminDecision?: OrderReturnDecision;
    adminNote?: string;
    requestedBySessionId?: string;
    requestedByUserId?: ObjectId;
    requestedFromStatus?: string;
    shipment?: OrderShippingDocument;
}

export interface OrderRefundDocument {
    status: 'not_requested' | 'pending' | 'partial' | 'succeeded' | 'failed';
    provider?: 'stripe' | 'tabby';
    amount?: number;
    currency?: string;
    requestedAt?: Date;
    processedAt?: Date;
    externalRefundId?: string;
    failureCode?: string;
    failureMessage?: string;
}

export interface OrderShippingDocument {
    provider: 'smsa';
    awb: string;
    createdAt: Date;
    labelPdf?: string; // Base64 or URL
    status?: string;
    lastTrackedAt?: Date;
}

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
    subtotalAmount?: number;
    shippingAmount?: number;
    vatAmount?: number;
    vatRatePercent?: number;
    vatIncludedInPrice?: boolean;
    countryCode?: string;
    totalAmount: number;
    currency: string;
    status: OrderStatus;
    shipping?: OrderShippingDocument;
    cancellation?: OrderCancellationDocument;
    returnRequest?: OrderReturnDocument;
    refund?: OrderRefundDocument;
    billingDetails?: BillingDetails;
    userId?: ObjectId;
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
    subtotalAmount?: number;
    shippingAmount?: number;
    vatAmount?: number;
    vatRatePercent?: number;
    vatIncludedInPrice?: boolean;
    countryCode?: string;
    totalAmount: number;
    currency: string;
    status: OrderStatus;
    shipping?: {
        provider: 'smsa';
        awb: string;
        createdAt: string;
        labelPdf?: string;
        status?: string;
        lastTrackedAt?: string;
    };
    cancellation?: {
        requestedAt?: string;
        approvedAt?: string;
        completedAt?: string;
        rejectedAt?: string;
        requestReason?: string;
        adminDecision?: OrderCancellationDecision;
        adminNote?: string;
        requestedBySessionId?: string;
        requestedByUserId?: string;
    };
    returnRequest?: {
        requestedAt?: string;
        approvedAt?: string;
        completedAt?: string;
        rejectedAt?: string;
        requestReason?: string;
        adminDecision?: OrderReturnDecision;
        adminNote?: string;
        requestedBySessionId?: string;
        requestedByUserId?: string;
        requestedFromStatus?: string;
        shipment?: {
            provider: 'smsa';
            awb: string;
            createdAt: string;
            labelPdf?: string;
            status?: string;
            lastTrackedAt?: string;
        };
    };
    refund?: {
        status: 'not_requested' | 'pending' | 'partial' | 'succeeded' | 'failed';
        provider?: 'stripe' | 'tabby';
        amount?: number;
        currency?: string;
        requestedAt?: string;
        processedAt?: string;
        externalRefundId?: string;
        failureCode?: string;
        failureMessage?: string;
    };
    billingDetails?: BillingDetails;
    userId?: string;
    createdAt: string;
    updatedAt: string;
}

function toIso(value?: Date): string | undefined {
    return value ? value.toISOString() : undefined;
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
        subtotalAmount: doc.subtotalAmount,
        shippingAmount: doc.shippingAmount,
        vatAmount: doc.vatAmount,
        vatRatePercent: doc.vatRatePercent,
        vatIncludedInPrice: doc.vatIncludedInPrice,
        countryCode: doc.countryCode,
        totalAmount: doc.totalAmount,
        currency: doc.currency,
        status: doc.status,
        shipping: doc.shipping
            ? {
                provider: doc.shipping.provider,
                awb: doc.shipping.awb,
                createdAt: doc.shipping.createdAt.toISOString(),
                labelPdf: doc.shipping.labelPdf,
                status: doc.shipping.status,
                lastTrackedAt: toIso(doc.shipping.lastTrackedAt),
            }
            : undefined,
        cancellation: doc.cancellation
            ? {
                requestedAt: toIso(doc.cancellation.requestedAt),
                approvedAt: toIso(doc.cancellation.approvedAt),
                completedAt: toIso(doc.cancellation.completedAt),
                rejectedAt: toIso(doc.cancellation.rejectedAt),
                requestReason: doc.cancellation.requestReason,
                adminDecision: doc.cancellation.adminDecision,
                adminNote: doc.cancellation.adminNote,
                requestedBySessionId: doc.cancellation.requestedBySessionId,
                requestedByUserId: doc.cancellation.requestedByUserId?.toHexString(),
            }
            : undefined,
        returnRequest: doc.returnRequest
            ? {
                requestedAt: toIso(doc.returnRequest.requestedAt),
                approvedAt: toIso(doc.returnRequest.approvedAt),
                completedAt: toIso(doc.returnRequest.completedAt),
                rejectedAt: toIso(doc.returnRequest.rejectedAt),
                requestReason: doc.returnRequest.requestReason,
                adminDecision: doc.returnRequest.adminDecision,
                adminNote: doc.returnRequest.adminNote,
                requestedBySessionId: doc.returnRequest.requestedBySessionId,
                requestedByUserId: doc.returnRequest.requestedByUserId?.toHexString(),
                requestedFromStatus: doc.returnRequest.requestedFromStatus,
                shipment: doc.returnRequest.shipment
                    ? {
                        provider: doc.returnRequest.shipment.provider,
                        awb: doc.returnRequest.shipment.awb,
                        createdAt: doc.returnRequest.shipment.createdAt.toISOString(),
                        labelPdf: doc.returnRequest.shipment.labelPdf,
                        status: doc.returnRequest.shipment.status,
                        lastTrackedAt: toIso(doc.returnRequest.shipment.lastTrackedAt),
                    }
                    : undefined,
            }
            : undefined,
        refund: doc.refund
            ? {
                status: doc.refund.status,
                provider: doc.refund.provider,
                amount: doc.refund.amount,
                currency: doc.refund.currency,
                requestedAt: toIso(doc.refund.requestedAt),
                processedAt: toIso(doc.refund.processedAt),
                externalRefundId: doc.refund.externalRefundId,
                failureCode: doc.refund.failureCode,
                failureMessage: doc.refund.failureMessage,
            }
            : undefined,
        billingDetails: doc.billingDetails,
        userId: doc.userId?.toHexString(),
        createdAt: doc.createdAt.toISOString(),
        updatedAt: doc.updatedAt.toISOString(),
    };
}
