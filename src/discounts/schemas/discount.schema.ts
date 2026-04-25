import { z } from 'zod';
import { DiscountType } from '../../common/interfaces/discount.interface';

const discountRulesSchema = z.object({
  percentage: z.number().min(0).max(100).optional(),
  amount: z.number().int().positive().optional(),
  buyQuantity: z.number().int().positive().optional(),
  getQuantity: z.number().int().positive().optional(),
  productId: z.string().optional(),
  minQuantity: z.number().int().positive().optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  applicableProductId: z.string().optional(),
});

export const createDiscountSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(1000),
  type: z.nativeEnum(DiscountType),
  isActive: z.boolean(),
  rules: discountRulesSchema,
});

export const updateDiscountSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(1).max(1000).optional(),
  type: z.nativeEnum(DiscountType).optional(),
  isActive: z.boolean().optional(),
  rules: discountRulesSchema.optional(),
});

export type CreateDiscountDto = z.infer<typeof createDiscountSchema>;
export type UpdateDiscountDto = z.infer<typeof updateDiscountSchema>;
