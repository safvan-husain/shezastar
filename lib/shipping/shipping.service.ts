import { enforceServerOnly } from '@/lib/utils/server-only';
import { AppError } from '@/lib/errors/app-error';
import { logger } from '@/lib/logging/logger';
import { Order } from '@/lib/order/model/order.model';
import { BillingDetails } from '@/lib/billing-details/billing-details.schema';
import { getCollection, ObjectId } from '@/lib/db/mongo-client';
import type { OrderDocument } from '@/lib/order/model/order.model';
import type { Filter } from 'mongodb';
import { SmsaShipmentAddress, CreateShipmentInput, SmsaShipmentResponse, SmsaTrackingResponse, SmsaTrackingWebhookPayload, SmsaTrackingWebhookItem } from './shipping.schema';
import { getProduct, updateProductWeight } from '@/lib/product/product.service';
import { getCountryPricings } from '@/lib/app-settings/app-settings.service';

function getSmsaBaseUrl() {
    const baseUrl = process.env.SMSA_BASE_URL?.replace(/\/$/, '');
    if (!baseUrl) {
        throw new AppError(500, 'SMSA_CONFIG_MISSING', { message: 'SMSA_BASE_URL is not configured.' });
    }

    return baseUrl;
}

function getHeaders() {
    const apiKey = process.env.SMSA_API_KEY;
    if (!apiKey) {
        throw new AppError(500, 'SMSA_CONFIG_MISSING', { message: 'SMSA_API_KEY is not configured.' });
    }
    return {
        'ApiKey': apiKey,
        'Content-Type': 'application/json',
    };
}

const SMSA_COUNTRY_CODE_ALIASES: Record<string, string> = {
    AE: 'AE',
    UAE: 'AE',
    'UNITED ARAB EMIRATES': 'AE',
    SA: 'SA',
    KSA: 'SA',
    'SAUDI ARABIA': 'SA',
    KW: 'KW',
    KUWAIT: 'KW',
    OM: 'OM',
    OMAN: 'OM',
    QA: 'QA',
    QATAR: 'QA',
    BH: 'BH',
    BAHRAIN: 'BH',
    US: 'US',
    USA: 'US',
    'UNITED STATES': 'US',
    'UNITED STATES OF AMERICA': 'US',
};

function normalizeCountryToken(value: string): string {
    return value.trim().toUpperCase().replace(/\s+/g, ' ');
}

async function resolveSmsaCountryCode(rawCountry: string): Promise<string> {
    const normalized = normalizeCountryToken(rawCountry);

    if (/^[A-Z]{2}$/.test(normalized)) {
        return normalized;
    }

    const fromAlias = SMSA_COUNTRY_CODE_ALIASES[normalized];
    if (fromAlias) {
        return fromAlias;
    }

    const countryPricings = await getCountryPricings();
    for (const country of countryPricings) {
        const codeToken = normalizeCountryToken(country.code);
        const nameToken = normalizeCountryToken(country.name);

        if (normalized === codeToken || normalized === nameToken) {
            const resolved = SMSA_COUNTRY_CODE_ALIASES[codeToken]
                || SMSA_COUNTRY_CODE_ALIASES[nameToken]
                || (/^[A-Z]{2}$/.test(codeToken) ? codeToken : undefined);
            if (resolved) {
                return resolved;
            }
        }
    }

    throw new AppError(400, 'INVALID_SMSA_COUNTRY_CODE', {
        message: 'Billing country cannot be mapped to an ISO-2 code accepted by SMSA.',
        country: rawCountry,
    });
}

export async function mapBillingToConsigneeAddress(billing: BillingDetails): Promise<SmsaShipmentAddress> {
    const name = `${billing.firstName} ${billing.lastName}`.trim();
    // ContactName length validation: 5-150.
    const validName = name.length < 5 ? name.padEnd(5, ' ') : name.slice(0, 150);

    const address1 = billing.streetAddress1;
    // AddressLine1 length validation: 10-100.
    const validAddress1 = address1.length < 10 ? address1.padEnd(10, ' ') : address1.slice(0, 100);
    const countryCode = await resolveSmsaCountryCode(billing.country);

    return {
        AddressLine1: validAddress1,
        AddressLine2: billing.streetAddress2?.slice(0, 100),
        City: billing.city.slice(0, 50),
        Country: countryCode,
        ContactName: validName,
        ContactPhoneNumber: billing.phone,
        PostalCode: billing.zip,
    };
}

export function getPlatformShipperAddress(): SmsaShipmentAddress {
    const name = process.env.SMSA_SHIPPER_NAME || 'Sheza Star';
    const cleanName = name.length < 5 ? name.padEnd(5, ' ') : name.slice(0, 150);
    
    let addr = process.env.SMSA_SHIPPER_ADDRESS || 'Placeholder Address';
    addr = addr.length < 10 ? addr.padEnd(10, ' ') : addr.slice(0, 100);

    return {
        AddressLine1: addr,
        City: process.env.SMSA_SHIPPER_CITY || 'Dubai',
        Country: process.env.SMSA_SHIPPER_COUNTRY || 'AE',
        ContactName: cleanName,
        ContactPhoneNumber: process.env.SMSA_SHIPPER_PHONE || '000000000',
        PostalCode: process.env.SMSA_SHIPPER_POSTAL_CODE,
    };
}

export interface MissingWeightProduct {
    productId: string;
    productName: string;
    currentWeight?: number;
}

/**
 * Validates product weights and throws AppError if any are missing.
 */
export async function validateOrderWeights(order: Order, overrides?: Record<string, number>): Promise<{ totalWeight: number, contents: string }> {
    let totalWeight = 0;
    const subtitles: string[] = [];
    const missingWeightProductIds: string[] = [];

    // Deduplicate product IDs to check
    const productIds = Array.from(new Set(order.items.map(item => item.productId)));

    for (const pid of productIds) {
        const itemQty = order.items.filter(i => i.productId === pid).reduce((sum, i) => sum + i.quantity, 0);
        const product = await getProduct(pid);

        if (product && product.subtitle) {
             subtitles.push(product.subtitle);
        } else {
             subtitles.push(product.name);
        }

        let itemWeight = product.weight;

        if (overrides && overrides[pid] !== undefined) {
             itemWeight = overrides[pid];
        }

        if (typeof itemWeight !== 'number' || itemWeight <= 0) {
             missingWeightProductIds.push(pid);
        } else {
             totalWeight += (itemWeight * itemQty);
        }
    }

    if (missingWeightProductIds.length > 0) {
         throw new AppError(400, 'MISSING_PRODUCT_WEIGHTS', {
             message: 'Some products are missing weight information.',
             productIds: missingWeightProductIds
         });
    }

    const uniqueSubtitles = Array.from(new Set(subtitles));
    let contentDescription = uniqueSubtitles.join(', ');
    if (contentDescription.length > 100) {
         contentDescription = contentDescription.substring(0, 97) + '...';
    }

    return { totalWeight, contents: contentDescription || 'Sheza Star Products' };
}

export async function getOrderMissingWeightProducts(order: Order): Promise<MissingWeightProduct[]> {
    const missingProducts: MissingWeightProduct[] = [];
    const productIds = Array.from(new Set(order.items.map(item => item.productId)));

    for (const productId of productIds) {
        const product = await getProduct(productId);
        const weight = product.weight;

        if (typeof weight !== 'number' || weight <= 0) {
            missingProducts.push({
                productId,
                productName: product.subtitle || product.name,
                currentWeight: typeof weight === 'number' ? weight : undefined,
            });
        }
    }

    return missingProducts;
}

export async function updateOrderProductWeights(
    order: Order,
    weights: Record<string, number>
): Promise<Array<{ productId: string; productName: string; weight: number }>> {
    const productIdsInOrder = new Set(order.items.map(item => item.productId));
    const requestedProductIds = Object.keys(weights);

    if (requestedProductIds.length === 0) {
        throw new AppError(400, 'NO_WEIGHTS_PROVIDED', {
            message: 'No product weights were provided.',
        });
    }

    const invalidProductIds = requestedProductIds.filter((productId) => !productIdsInOrder.has(productId));
    if (invalidProductIds.length > 0) {
        throw new AppError(400, 'INVALID_ORDER_PRODUCTS', {
            message: 'Some products do not belong to this order.',
            productIds: invalidProductIds,
        });
    }

    const updatedProducts: Array<{ productId: string; productName: string; weight: number }> = [];
    for (const productId of requestedProductIds) {
        const updated = await updateProductWeight(productId, weights[productId]);
        updatedProducts.push({
            productId,
            productName: updated.subtitle || updated.name,
            weight: updated.weight ?? weights[productId],
        });
    }

    return updatedProducts;
}

export async function createB2cShipment(order: Order, input: CreateShipmentInput): Promise<SmsaShipmentResponse> {
    if (!order.billingDetails) {
        throw new AppError(400, 'BILLING_DETAILS_MISSING', { message: 'Order is missing billing details.' });
    }

    // This will throw 400 if weights are missing, handled by the controller
    const { totalWeight, contents } = await validateOrderWeights(order, input.weightOverrides);
    const totalParcels = order.items.reduce((sum, item) => sum + item.quantity, 0);

    const payload = {
        CODAmount: 0,
        ConsigneeAddress: await mapBillingToConsigneeAddress(order.billingDetails),
        ContentDescription: contents,
        DeclaredValue: order.totalAmount, // or subtotal
        OrderNumber: order.id,
        Parcels: totalParcels,
        ShipDate: new Date().toISOString(),
        ShipmentCurrency: order.currency.toUpperCase(),
        ShipperAddress: getPlatformShipperAddress(),
        WaybillType: 'PDF',
        Weight: totalWeight,
        WeightUnit: 'KG', 
    };

    const res = await fetch(`${getSmsaBaseUrl()}/api/shipment/b2c/new`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text();
        console.error('SMSA Create Shipment Error:', res.status, text);
        throw new AppError(res.status, 'SMSA_API_ERROR', { message: 'Failed to create SMSA shipment', details: text });
    }

    const data = await res.json();
    return data as SmsaShipmentResponse;
}

export async function createC2bShipment(order: Order, input: CreateShipmentInput): Promise<SmsaShipmentResponse> {
    if (!order.billingDetails) {
        throw new AppError(400, 'BILLING_DETAILS_MISSING', { message: 'Order is missing billing details.' });
    }

    const { contents } = await validateOrderWeights(order, input.weightOverrides);
    const totalParcels = order.items.reduce((sum, item) => sum + item.quantity, 0);

    const payload = {
        ContentDescription: contents,
        DeclaredValue: order.totalAmount,
        OrderNumber: order.id,
        Parcels: totalParcels,
        PickupAddress: await mapBillingToConsigneeAddress(order.billingDetails),
        ReturnToAddress: getPlatformShipperAddress(),
    };

    const res = await fetch(`${getSmsaBaseUrl()}/api/c2b/new`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    if (!res.ok) {
        const text = await res.text();
        console.error('SMSA Create Return Shipment Error:', res.status, text);
        throw new AppError(res.status, 'SMSA_API_ERROR', { message: 'Failed to create SMSA return shipment', details: text });
    }

    const data = await res.json();
    return data as SmsaShipmentResponse;
}

async function trackShipmentByAwb(awb: string): Promise<SmsaTrackingResponse> {
    const res = await fetch(`${getSmsaBaseUrl()}/api/track/single/${awb}`, {
        method: 'GET',
        headers: getHeaders(),
    });

    if (!res.ok) {
        const text = await res.text();
        console.error('SMSA Track Error:', res.status, text);
        throw new AppError(res.status, 'SMSA_API_ERROR', { message: 'Failed to track SMSA shipment', details: text });
    }

    const data = await res.json();
    return data as SmsaTrackingResponse;
}

async function trackShipmentByReference(reference: string): Promise<SmsaTrackingResponse> {
    const res = await fetch(`${getSmsaBaseUrl()}/api/track/reference/${reference}`, {
        method: 'GET',
        headers: getHeaders(),
    });

    if (!res.ok) {
        const text = await res.text();
        console.error('SMSA Track By Reference Error:', res.status, text);
        throw new AppError(res.status, 'SMSA_API_ERROR', { message: 'Failed to track SMSA shipment', details: text });
    }

    const data = await res.json();
    return data as SmsaTrackingResponse;
}

export async function trackShipment(awb: string, reference?: string): Promise<SmsaTrackingResponse> {
    try {
        return await trackShipmentByAwb(awb);
    } catch (error) {
        const shouldFallback = reference
            && error instanceof AppError
            && error.status === 404
            && error.code === 'SMSA_API_ERROR';

        if (!shouldFallback) {
            throw error;
        }

        return trackShipmentByReference(reference);
    }
}

export async function queryShipment(awb: string): Promise<SmsaShipmentResponse> {

    const res = await fetch(`${getSmsaBaseUrl()}/api/shipment/b2c/query/${awb}`, {
        method: 'GET',
        headers: getHeaders(),
    });

    if (!res.ok) {
        const text = await res.text();
        console.error('SMSA Query Error:', res.status, text);
        throw new AppError(res.status, 'SMSA_API_ERROR', { message: 'Failed to query SMSA shipment', details: text });
    }

    const data = await res.json();
    return data as SmsaShipmentResponse;
}

export async function getShipmentLabel(awb: string): Promise<Buffer> {
    const shipment = await queryShipment(awb);
    if (!shipment.waybills || shipment.waybills.length === 0 || !shipment.waybills[0].awbFile) {
        throw new AppError(404, 'LABEL_NOT_FOUND', { message: 'No label found in SMSA query response.' });
    }

    const base64Data = shipment.waybills[0].awbFile;
    return Buffer.from(base64Data, 'base64');
}

type SmsaTrackingWebhookScan = NonNullable<SmsaTrackingWebhookItem['Scans']>[number];
const cancellationManagedStatuses = new Set([
    'cancellation_requested',
    'cancellation_approved',
    'return_requested',
    'return_approved',
    'refund_approved',
    'refunded',
    'cancelled',
]);

function resolveLatestScan(shipment: { Scans?: SmsaTrackingWebhookItem['Scans'] }): SmsaTrackingWebhookScan | undefined {
    if (!shipment.Scans || shipment.Scans.length === 0) {
        return undefined;
    }

    const scans = [...shipment.Scans];
    scans.sort((a, b) => {
        const aTime = parseScanTimestamp(a.ScanDateTime, a.ScanTimeZone);
        const bTime = parseScanTimestamp(b.ScanDateTime, b.ScanTimeZone);
        return bTime.getTime() - aTime.getTime();
    });

    return scans[0];
}

function parseScanTimestamp(scanDateTime: string, scanTimeZone?: string): Date {
    const hasTimezone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(scanDateTime);
    const dateCandidate = hasTimezone || !scanTimeZone
        ? scanDateTime
        : `${scanDateTime}${scanTimeZone}`;

    const parsed = new Date(dateCandidate);
    if (Number.isNaN(parsed.getTime())) {
        return new Date(0);
    }

    return parsed;
}

function parseReferenceObjectId(reference?: string): ObjectId | null {
    if (!reference) {
        return null;
    }

    try {
        return new ObjectId(reference);
    } catch {
        return null;
    }
}

export interface SmsaTrackingWebhookProcessResult {
    received: number;
    processed: number;
    updatedOrders: number;
    statusTransitionedOrders: number;
    unmatchedAwbs: string[];
}

type SmsaWebhookLogOptions = {
    webhookRequestId?: string;
};

function buildWebhookLogMeta(options?: SmsaWebhookLogOptions) {
    return {
        webhookRequestId: options?.webhookRequestId,
    };
}

function summarizeUpdateSet(updateSet: Record<string, unknown>) {
    return {
        status: updateSet.status,
        shippingStatus: updateSet['shipping.status'],
        lastTrackedAt: updateSet['shipping.lastTrackedAt'],
        updatedAt: updateSet.updatedAt,
    };
}

function buildSmsaOrderFilter(filter: {
    orderId?: ObjectId;
    awb?: string;
}): Filter<OrderDocument> {
    return {
        ...(filter.orderId ? { _id: filter.orderId } : {}),
        'shipping.provider': 'smsa',
        ...(filter.awb ? { 'shipping.awb': filter.awb } : {}),
    } as Filter<OrderDocument>;
}

function buildTrackingUpdateSet(
    shipment: Pick<SmsaTrackingWebhookItem, 'Scans' | 'isDelivered'>,
    currentOrderStatus: string,
): Record<string, unknown> {
    const latestScan = resolveLatestScan(shipment);
    const latestScanDate = latestScan
        ? parseScanTimestamp(latestScan.ScanDateTime, latestScan.ScanTimeZone)
        : null;

    const shippingStatus = latestScan?.ScanDescription
        || latestScan?.ScanType
        || (shipment.isDelivered ? 'Delivered' : undefined);

    const updateSet: Record<string, unknown> = {
        updatedAt: new Date(),
    };

    if (shippingStatus) {
        updateSet['shipping.status'] = shippingStatus;
    }

    if (latestScanDate && latestScanDate.getTime() > 0) {
        updateSet['shipping.lastTrackedAt'] = latestScanDate;
    }

    const scanTypeStatus = latestScan?.ScanType?.trim();
    const resolvedScanStatus = scanTypeStatus && scanTypeStatus.length > 0
        ? scanTypeStatus
        : (shipment.isDelivered ? 'DL' : undefined);

    if (
        resolvedScanStatus
        && !cancellationManagedStatuses.has(currentOrderStatus)
        && currentOrderStatus !== 'refund_failed'
        && currentOrderStatus !== 'failed'
    ) {
        updateSet.status = resolvedScanStatus;
    }

    return updateSet;
}

export async function syncOrderTrackingState(
    orderId: string,
    currentOrderStatus: string,
    shipment: SmsaTrackingResponse,
): Promise<void> {
    const collection = await getCollection<OrderDocument>('orders');
    const updateSet = buildTrackingUpdateSet(shipment, currentOrderStatus);

    await collection.updateOne(
        buildSmsaOrderFilter({
            orderId: new ObjectId(orderId),
        }),
        {
            $set: updateSet,
        },
    );
}

export async function processSmsaTrackingWebhook(
    payload: SmsaTrackingWebhookPayload,
    options?: SmsaWebhookLogOptions,
): Promise<SmsaTrackingWebhookProcessResult> {
    const baseLogMeta = buildWebhookLogMeta(options);
    await logger.debug('SMSA webhook service: starting payload processing', {
        ...baseLogMeta,
        shipmentCount: payload.length,
    });

    const collection = await getCollection<OrderDocument>('orders');
    await logger.debug('SMSA webhook service: orders collection loaded', baseLogMeta);

    let updatedOrders = 0;
    let statusTransitionedOrders = 0;
    const unmatchedAwbs: string[] = [];

    for (const [index, shipment] of payload.entries()) {
        const awb = shipment.AWB.trim();
        const shipmentLogMeta = {
            ...baseLogMeta,
            shipmentIndex: index,
            awb,
            reference: shipment.Reference,
            isDelivered: shipment.isDelivered,
            scanCount: shipment.Scans?.length ?? 0,
        };

        await logger.debug('SMSA webhook service: shipment processing started', shipmentLogMeta);

        await logger.debug('SMSA webhook service: searching order by AWB', shipmentLogMeta);
        let orderDoc = await collection.findOne(buildSmsaOrderFilter({ awb }));

        if (orderDoc) {
            await logger.debug('SMSA webhook service: order matched by AWB', {
                ...shipmentLogMeta,
                orderId: String(orderDoc._id),
                currentOrderStatus: orderDoc.status,
            });
        }

        if (!orderDoc) {
            const referenceObjectId = parseReferenceObjectId(shipment.Reference);
            await logger.debug('SMSA webhook service: AWB match missing, checking reference', {
                ...shipmentLogMeta,
                hasReferenceObjectId: Boolean(referenceObjectId),
            });
            if (referenceObjectId) {
                orderDoc = await collection.findOne(buildSmsaOrderFilter({
                    orderId: referenceObjectId,
                }));

                if (orderDoc) {
                    await logger.debug('SMSA webhook service: order matched by reference', {
                        ...shipmentLogMeta,
                        orderId: String(orderDoc._id),
                        currentOrderStatus: orderDoc.status,
                    });
                }
            }
        }

        if (!orderDoc) {
            unmatchedAwbs.push(awb);
            await logger.error('SMSA webhook service: no matching order found', shipmentLogMeta);
            continue;
        }

        const updateSet = buildTrackingUpdateSet(shipment, orderDoc.status);
        await logger.debug('SMSA webhook service: tracking update set built', {
            ...shipmentLogMeta,
            orderId: String(orderDoc._id),
            currentOrderStatus: orderDoc.status,
            details: summarizeUpdateSet(updateSet),
        });

        if (typeof updateSet.status === 'string' && updateSet.status !== orderDoc.status) {
            statusTransitionedOrders += 1;
            await logger.log('SMSA webhook service: order status transition detected', {
                ...shipmentLogMeta,
                orderId: String(orderDoc._id),
                previousStatus: orderDoc.status,
                nextStatus: updateSet.status,
            });
        }

        await logger.debug('SMSA webhook service: updating order tracking fields', {
            ...shipmentLogMeta,
            orderId: String(orderDoc._id),
        });
        const updateResult = await collection.updateOne(
            { _id: orderDoc._id },
            {
                $set: updateSet,
            },
        );
        await logger.log('SMSA webhook service: order update completed', {
            ...shipmentLogMeta,
            orderId: String(orderDoc._id),
            matchedCount: updateResult.matchedCount,
            modifiedCount: updateResult.modifiedCount,
            details: summarizeUpdateSet(updateSet),
        });

        updatedOrders += 1;
    }

    const result = {
        received: payload.length,
        processed: payload.length,
        updatedOrders,
        statusTransitionedOrders,
        unmatchedAwbs,
    };

    await logger.log('SMSA webhook service: payload processing completed', {
        ...baseLogMeta,
        details: result,
    });

    return result;
}
enforceServerOnly('shipping.service');
