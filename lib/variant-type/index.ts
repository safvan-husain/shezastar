// lib/variant-type/index.ts
import type { VariantItem as PrismaVariantItem, VariantType as PrismaVariantType } from '@prisma/client';

export type VariantType = PrismaVariantType;
export type VariantItem = PrismaVariantItem;

export * from '@/lib/validations/variant-type.schema';
export * from '@/lib/services/variant-type.service';
export * from './variant-type.controller';
