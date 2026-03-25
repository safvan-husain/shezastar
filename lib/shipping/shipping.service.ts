import 'server-only';
import { AppError } from '@/lib/errors/app-error';
import { Order } from '@/lib/order/model/order.model';
import { BillingDetails } from '@/lib/billing-details/billing-details.schema';
import { SmsaShipmentAddress, CreateShipmentInput, SmsaShipmentResponse, SmsaTrackingResponse } from './shipping.schema';
import { getProduct } from '@/lib/product/product.service';

const SMSA_API_KEY = process.env.SMSA_API_KEY;
const SMSA_BASE_URL = process.env.SMSA_BASE_URL?.replace(/\/$/, '');

function getHeaders() {
    if (!SMSA_API_KEY) {
        throw new AppError(500, 'SMSA_CONFIG_MISSING', { message: 'SMSA_API_KEY is not configured.' });
    }
    return {
        'ApiKey': SMSA_API_KEY,
        'Content-Type': 'application/json',
    };
}

export function mapBillingToConsigneeAddress(billing: BillingDetails): SmsaShipmentAddress {
    const name = `${billing.firstName} ${billing.lastName}`.trim();
    // ContactName length validation: 5-150.
    const validName = name.length < 5 ? name.padEnd(5, ' ') : name.slice(0, 150);

    const address1 = billing.streetAddress1;
    // AddressLine1 length validation: 10-100.
    const validAddress1 = address1.length < 10 ? address1.padEnd(10, ' ') : address1.slice(0, 100);

    return {
        AddressLine1: validAddress1,
        AddressLine2: billing.streetAddress2?.slice(0, 100),
        City: billing.city.slice(0, 50),
        Country: billing.country,
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

export async function createB2cShipment(order: Order, input: CreateShipmentInput): Promise<SmsaShipmentResponse> {
    if (!SMSA_BASE_URL) {
        throw new AppError(500, 'SMSA_CONFIG_MISSING', { message: 'SMSA_BASE_URL is not configured.' });
    }

    if (!order.billingDetails) {
        throw new AppError(400, 'BILLING_DETAILS_MISSING', { message: 'Order is missing billing details.' });
    }

    // This will throw 400 if weights are missing, handled by the controller
    const { totalWeight, contents } = await validateOrderWeights(order, input.weightOverrides);
    const totalParcels = order.items.reduce((sum, item) => sum + item.quantity, 0);

    const payload = {
        CODAmount: 0,
        ConsigneeAddress: mapBillingToConsigneeAddress(order.billingDetails),
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

    const res = await fetch(`${SMSA_BASE_URL}/api/shipment/b2c/new`, {
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

export async function trackShipment(awb: string): Promise<SmsaTrackingResponse> {
    if (!SMSA_BASE_URL) {
        throw new AppError(500, 'SMSA_CONFIG_MISSING', { message: 'SMSA_BASE_URL is not configured.' });
    }

    const res = await fetch(`${SMSA_BASE_URL}/api/track/single/${awb}`, {
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

export async function queryShipment(awb: string): Promise<SmsaShipmentResponse> {
    if (!SMSA_BASE_URL) {
        throw new AppError(500, 'SMSA_CONFIG_MISSING', { message: 'SMSA_BASE_URL is not configured.' });
    }

    const res = await fetch(`${SMSA_BASE_URL}/api/shipment/b2c/query/${awb}`, {
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
