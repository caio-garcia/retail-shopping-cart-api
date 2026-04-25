export enum CartStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  EXPIRED = 'EXPIRED',
}

export interface CartItem {
  productId: string;
  productName: string;
  price: number; // Price snapshot at time of adding
  quantity: number;
}

export interface Cart {
  id: string;
  items: CartItem[];
  status: CartStatus;
  createdAt: number;
  lastActivityAt: number;
}

export interface AddItemInput {
  productId: string;
  quantity: number;
}

export interface UpdateItemInput {
  quantity: number;
}

export interface CartTotals {
  subtotal: number;
  discounts: DiscountApplied[];
  total: number;
}

export interface DiscountApplied {
  discountId: string;
  discountName: string;
  amount: number;
}

export interface CheckoutResult {
  cartId: string;
  items: CartItem[];
  subtotal: number;
  discounts: DiscountApplied[];
  total: number;
  completedAt: number;
}
