import { catchError, AppError } from '@/lib/errors/app-error';
import { getOrderById, updateOrderStatusById, setOrderShipping } from '@/lib/order/order.service';
import { createB2cShipment, getShipmentLabel, trackShipment } from './shipping.service';
import { CreateShipmentInputSchema, CreateShipmentInput } from './shipping.schema';

export async function handleCreateShipment(orderId: string, input: unknown) {
    try {
        const order = await getOrderById(orderId);

        if (order.status !== 'paid') {
            throw new AppError(400, 'INVALID_ORDER_STATUS', { 
                message: 'Shipment can only be created for paid orders.',
                orderStatus: order.status
            });
        }

        if (order.shipping?.awb) {
            throw new AppError(400, 'SHIPMENT_ALREADY_EXISTS', { 
                message: 'A shipment already exists for this order.',
                awb: order.shipping.awb
            });
        }

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

        // Update the main order status to 'shipped'
        await updateOrderStatusById(orderId, 'shipped');

        return { status: 200, body: tracking.shipping };

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
