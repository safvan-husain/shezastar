import { z } from 'zod';

/**
 * Billing details (aka "building information") required before checkout.
 * These fields mirror the `BillingDetails` type provided in requirements.
 */
export const BillingDetailsSchema = z.object({
    email: z.string().min(1).email(),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    country: z.string().min(1),
    streetAddress1: z.string().min(1),
    streetAddress2: z.string().optional(),
    city: z.string().min(1),
    stateOrCounty: z.string().optional(),
    phone: z.string().min(1),
    orderNotes: z.string().optional(),
});

export type BillingDetails = z.infer<typeof BillingDetailsSchema>;

