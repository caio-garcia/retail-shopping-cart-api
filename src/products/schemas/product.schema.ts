import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(1000),
  price: z.number().int().positive(),
  stock: z.number().int().min(0),
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(1).max(1000).optional(),
  price: z.number().int().positive().optional(),
  stock: z.number().int().min(0).optional(),
});

export const adjustStockSchema = z.object({
  stock: z.number().int().min(0),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
export type UpdateProductDto = z.infer<typeof updateProductSchema>;
export type AdjustStockDto = z.infer<typeof adjustStockSchema>;
