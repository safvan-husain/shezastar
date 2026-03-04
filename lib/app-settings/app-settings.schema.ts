import { z } from 'zod';

export const HeroBannerSchema = z.object({
    imagePath: z.string().min(1, 'Image path is required'),
    title: z.string().min(1, 'Title is required'),
    description: z.string().min(1, 'Description is required'),
    price: z.number().min(0, 'Price must be positive'),
    offerPrice: z.number().min(0, 'Offer price must be positive'),
    offerLabel: z.string().min(1, 'Offer label is required'),
});

export const HeroBannerWithIdSchema = HeroBannerSchema.extend({
    id: z.string().min(1, 'ID is required'),
});

export const CreateHeroBannerSchema = HeroBannerSchema;

export const UpdateHeroBannerSchema = HeroBannerSchema;

export type HeroBanner = z.infer<typeof HeroBannerSchema>;
export type HeroBannerWithId = z.infer<typeof HeroBannerWithIdSchema>;
export type CreateHeroBannerInput = z.infer<typeof CreateHeroBannerSchema>;
export type UpdateHeroBannerInput = z.infer<typeof UpdateHeroBannerSchema>;

// Custom Cards Schema
export const CustomCardSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    subtitle: z.string().min(1, 'Subtitle is required'),
    imagePath: z.string().min(1, 'Image path is required'),
    offerLabel: z.string().min(1, 'Offer label is required'),
    urlLink: z.string().url('Must be a valid URL'),
});

export const CustomCardsSchema = z.object({
    card1: CustomCardSchema.nullable(),
    card2: CustomCardSchema.nullable(),
    card3: CustomCardSchema.nullable(),
    card4: CustomCardSchema.nullable(),
    card5: CustomCardSchema.nullable(),
    card6: CustomCardSchema.nullable(),
});

export const CreateCustomCardSchema = CustomCardSchema;
export const UpdateCustomCardSchema = CustomCardSchema;

export type CustomCard = z.infer<typeof CustomCardSchema>;
export type CustomCards = z.infer<typeof CustomCardsSchema>;
export type CreateCustomCardInput = z.infer<typeof CreateCustomCardSchema>;
export type UpdateCustomCardInput = z.infer<typeof UpdateCustomCardSchema>;

// Featured Products Schema
export const FeaturedProductIdSchema = z.string().min(1, 'Product ID is required');

export const AddFeaturedProductSchema = z.object({
    productId: FeaturedProductIdSchema,
});

export type AddFeaturedProductInput = z.infer<typeof AddFeaturedProductSchema>;

// Installation Locations Schema
export const InstallationLocationSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1, 'Location name is required'),
    priceDelta: z.number().min(0).default(0),
});

export const InstallationLocationsSchema = z.array(InstallationLocationSchema);
export type InstallationLocation = z.infer<typeof InstallationLocationSchema>;

// Country Pricing Schema
export const CountryCodeSchema = z.string().trim().min(2).max(8).transform((value) => value.toUpperCase());
export const CountryDefaultCurrencySchema = z.enum(['AED', 'USD', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR']);

export const CountryPricingSchema = z.object({
    id: z.string().min(1),
    code: CountryCodeSchema,
    name: z.string().trim().min(1, 'Country name is required'),
    defaultCurrency: CountryDefaultCurrencySchema,
    vatRatePercent: z.number().min(0, 'VAT must be >= 0'),
    vatIncludedInPrice: z.boolean().default(false),
    shippingChargeAed: z.number().min(0, 'Shipping must be >= 0'),
    isActive: z.boolean().default(true),
});

export const CountryPricingsSchema = z.array(CountryPricingSchema);
export const CreateCountryPricingSchema = CountryPricingSchema.omit({ id: true });
export const UpdateCountryPricingSchema = CountryPricingSchema.omit({ id: true });

export type CountryPricing = z.infer<typeof CountryPricingSchema>;
export type CreateCountryPricingInput = z.infer<typeof CreateCountryPricingSchema>;
export type UpdateCountryPricingInput = z.infer<typeof UpdateCountryPricingSchema>;
