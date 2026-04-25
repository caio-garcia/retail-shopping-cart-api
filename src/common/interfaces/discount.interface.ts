export enum DiscountType {
  PERCENTAGE_OFF = 'PERCENTAGE_OFF',
  FIXED_AMOUNT_OFF = 'FIXED_AMOUNT_OFF',
  BUY_X_GET_Y = 'BUY_X_GET_Y',
  BULK_PRICING = 'BULK_PRICING',
}

export interface Discount {
  id: string;
  name: string;
  description: string;
  type: DiscountType;
  isActive: boolean;
  rules: DiscountRules;
  createdAt: number;
  updatedAt: number;
}

export interface DiscountRules {
  percentage?: number; // e.g., 20 for 20% off

  amount?: number; // Amount in cents

  buyQuantity?: number; // Buy X items
  getQuantity?: number; // Get Y items free
  productId?: string; // Specific product for the offer

  minQuantity?: number; // Minimum quantity to qualify
  discountPercentage?: number; // Discount percentage for bulk
  applicableProductId?: string; // Specific product for bulk pricing
}

export interface CreateDiscountInput {
  name: string;
  description: string;
  type: DiscountType;
  isActive: boolean;
  rules: DiscountRules;
}

export interface UpdateDiscountInput {
  name?: string;
  description?: string;
  type?: DiscountType;
  isActive?: boolean;
  rules?: DiscountRules;
}
