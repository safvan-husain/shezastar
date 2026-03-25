import { catchError, AppError } from '@/lib/errors/app-error';
import { getOrderById, setOrderShipping, updateOrderStatusById } from '@/lib/order/order.service';
import {
    createB2cShipment,
    getShipmentLabel,
    trackShipment,
    getOrderMissingWeightProducts,
    updateOrderProductWeights,
    processSmsaTrackingWebhook,
} from './shipping.service';
import {
    CreateShipmentInputSchema,
    CreateShipmentInput,
    UpdateShipmentWeightsInputSchema,
    UpdateShipmentWeightsInput,
    SmsaTrackingWebhookPayloadSchema,
    SmsaTrackingWebhookPayload,
} from './shipping.schema';

function assertShipmentEligible(order: Awaited<ReturnType<typeof getOrderById>>) {
    if (order.status !== 'paid') {
        throw new AppError(400, 'INVALID_ORDER_STATUS', {
            message: 'Shipment can only be created for paid orders.',
            orderStatus: order.status,
        });
    }

    if (order.shipping?.awb) {
        throw new AppError(400, 'SHIPMENT_ALREADY_EXISTS', {
            message: 'A shipment already exists for this order.',
            awb: order.shipping.awb
        });
    }
}

export async function handleCreateShipment(orderId: string, input: unknown) {
    try {
        const order = await getOrderById(orderId);
        assertShipmentEligible(order);

        const parsed: CreateShipmentInput = CreateShipmentInputSchema.parse(input);

        // createB2cShipment does weight validation, and creates the shipment in SMSA
        const response = await createB2cShipment(order, parsed);

        // Create the shipping doc on the order
        const tracking = await setOrderShipping(orderId, {
            provider: 'smsa',
            awb: response.sawb,
            createdAt: new Date(),
            status: 'created',
            labelPdf: response.waybills?.[0]?.awbFile, // cache the label if available
        });

        await updateOrderStatusById(orderId, 'requested_shipment');

        return { status: 200, body: tracking.shipping };

    } catch (err) {
        return catchError(err);
    }
}

export async function handleShipmentWeightCheck(orderId: string) {
    try {
        const order = await getOrderById(orderId);
        assertShipmentEligible(order);

        const missingProducts = await getOrderMissingWeightProducts(order);
        return {
            status: 200,
            body: {
                canProceed: missingProducts.length === 0,
                missingProducts,
            },
        };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleUpdateShipmentWeights(orderId: string, input: unknown) {
    try {
        const order = await getOrderById(orderId);
        assertShipmentEligible(order);

        const parsed: UpdateShipmentWeightsInput = UpdateShipmentWeightsInputSchema.parse(input);
        const updatedProducts = await updateOrderProductWeights(order, parsed.weights);

        return {
            status: 200,
            body: {
                updatedProducts,
            },
        };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleTrackShipment(orderId: string) {
    try {
        const order = await getOrderById(orderId);

        if (!order.shipping || order.shipping.provider !== 'smsa' || !order.shipping.awb) {
            throw new AppError(404, 'SHIPMENT_NOT_FOUND', { message: 'No SMSA shipment found for this order.' });
        }

        const data = await trackShipment(order.shipping.awb);
        return { status: 200, body: data };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleGetShipmentLabel(orderId: string) {
    try {
        const order = await getOrderById(orderId);

        if (!order.shipping || order.shipping.provider !== 'smsa' || !order.shipping.awb) {
            throw new AppError(404, 'SHIPMENT_NOT_FOUND', { message: 'No SMSA shipment found for this order.' });
        }

        const pdfBuffer = await getShipmentLabel(order.shipping.awb);
        return { status: 200, body: pdfBuffer };
    } catch (err) {
        return catchError(err);
    }
}

export async function handleSmsaTrackingWebhook(input: unknown) {
    try {
        const parsed: SmsaTrackingWebhookPayload = SmsaTrackingWebhookPayloadSchema.parse(input);
        const result = await processSmsaTrackingWebhook(parsed);
        return { status: 200, body: result };
    } catch (err) {
        return catchError(err);
    }
}
