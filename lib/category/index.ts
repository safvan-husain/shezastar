// lib/category/index.ts
import type { Category as PrismaCategory, SubCategory as PrismaSubCategory } from '@prisma/client';

export type Category = PrismaCategory;
export type SubCategory = PrismaSubCategory;

export * from '@/lib/validations/category.schema';
export * from '@/lib/services/category.service';
export * from './category.controller';
