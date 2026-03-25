import { z } from 'zod';

export const SmsaShipmentAddressSchema = z.object({
    AddressLine1: z.string().min(10).max(100),
    AddressLine2: z.string().max(100).optional(),
    City: z.string().min(3).max(50),
    Country: z.string().length(2),
    ContactName: z.string().min(5).max(150),
    ContactPhoneNumber: z.string().min(1),
    PostalCode: z.string().optional(),
});

export const CreateShipmentInputSchema = z.object({
    weightOverrides: z.record(z.string(), z.number().min(0)).optional(), 
});

export const UpdateShipmentWeightsInputSchema = z.object({
    weights: z.record(z.string(), z.number().positive()),
});

export const ShipmentWeightCheckResponseSchema = z.object({
    canProceed: z.boolean(),
    missingProducts: z.array(z.object({
        productId: z.string(),
        productName: z.string(),
        currentWeight: z.number().optional(),
    })),
});

export const SmsaShipmentResponseSchema = z.object({
    sawb: z.string(),
    createDate: z.string(),
    shipmentParcelsCount: z.number(),
    waybills: z.array(z.object({
        awb: z.string(),
        awbFile: z.string(), // base64 pdf content
    })),
});

export const SmsaTrackingScanSchema = z.object({
    ReferenceID: z.number().optional(),
    ReceivedBy: z.string().optional(),
    City: z.string(),
    ScanType: z.string(),
    ScanDescription: z.string(),
    ScanDateTime: z.string(),
    ScanTimeZone: z.string().optional(),
});

export const SmsaTrackingResponseSchema = z.object({
    AWB: z.string(),
    Reference: z.string().optional(),
    Pieces: z.number().optional(),
    CODAmount: z.number().optional(),
    ContentDesc: z.string().optional(),
    RecipientName: z.string().optional(),
    OriginCity: z.string().optional(),
    OriginCountry: z.string().optional(),
    DesinationCity: z.string().optional(),
    DesinationCountry: z.string().optional(),
    isDelivered: z.boolean().optional().default(false),
    Scans: z.array(SmsaTrackingScanSchema).optional(),
});

export const SmsaTrackingWebhookItemSchema = z.object({
    AWB: z.string().min(1),
    Reference: z.string().optional(),
    Pieces: z.number().optional(),
    CODAmount: z.number().optional(),
    ContentDesc: z.string().optional(),
    RecipientName: z.string().optional(),
    OriginCity: z.string().optional(),
    OriginCountry: z.string().optional(),
    DesinationCity: z.string().optional(),
    DesinationCountry: z.string().optional(),
    isDelivered: z.boolean().optional().default(false),
    Scans: z.array(SmsaTrackingScanSchema).optional(),
});

export const SmsaTrackingWebhookPayloadSchema = z.array(SmsaTrackingWebhookItemSchema).min(1);

export type SmsaShipmentAddress = z.infer<typeof SmsaShipmentAddressSchema>;
export type CreateShipmentInput = z.infer<typeof CreateShipmentInputSchema>;
export type UpdateShipmentWeightsInput = z.infer<typeof UpdateShipmentWeightsInputSchema>;
export type SmsaShipmentResponse = z.infer<typeof SmsaShipmentResponseSchema>;
export type SmsaTrackingResponse = z.infer<typeof SmsaTrackingResponseSchema>;
export type SmsaTrackingWebhookItem = z.infer<typeof SmsaTrackingWebhookItemSchema>;
export type SmsaTrackingWebhookPayload = z.infer<typeof SmsaTrackingWebhookPayloadSchema>;
export type ShipmentWeightCheckResponse = z.infer<typeof ShipmentWeightCheckResponseSchema>;
