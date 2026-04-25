import { z } from 'zod';

export const addItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const updateItemSchema = z.object({
  quantity: z.number().int().positive(),
});

export const createCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export const createCartSchema = z.object({
  items: z.array(createCartItemSchema).optional(),
});

export type AddItemDto = z.infer<typeof addItemSchema>;
export type UpdateItemDto = z.infer<typeof updateItemSchema>;
export type CreateCartDto = z.infer<typeof createCartSchema>;
