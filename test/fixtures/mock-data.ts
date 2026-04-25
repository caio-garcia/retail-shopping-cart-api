import { Product } from '../../src/common/interfaces/product.interface';
import {
  Discount,
  DiscountType,
} from '../../src/common/interfaces/discount.interface';
import { Cart, CartStatus } from '../../src/common/interfaces/cart.interface';

export const mockProducts: Product[] = [
  {
    id: 'test-prod-1',
    name: 'Test Laptop',
    description: 'Test laptop for unit tests',
    price: 100000, // $1000.00
    stock: 10,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'test-prod-2',
    name: 'Test Mouse',
    description: 'Test mouse for unit tests',
    price: 2500, // $25.00
    stock: 50,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'test-prod-3',
    name: 'Test Keyboard',
    description: 'Test keyboard for unit tests',
    price: 5000, // $50.00
    stock: 5,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export const mockDiscounts: Discount[] = [
  {
    id: 'test-disc-1',
    name: 'Test 10% Off',
    description: 'Test percentage discount',
    type: DiscountType.PERCENTAGE_OFF,
    isActive: true,
    rules: {
      percentage: 10,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'test-disc-2',
    name: 'Test Buy 2 Get 1 Free',
    description: 'Test BOGO discount',
    type: DiscountType.BUY_X_GET_Y,
    isActive: true,
    rules: {
      buyQuantity: 2,
      getQuantity: 1,
      productId: 'test-prod-2',
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'test-disc-3',
    name: 'Test Bulk Discount',
    description: 'Test bulk pricing discount',
    type: DiscountType.BULK_PRICING,
    isActive: true,
    rules: {
      minQuantity: 3,
      discountPercentage: 15,
      applicableProductId: 'test-prod-3',
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'test-disc-4',
    name: 'Test $20 Off',
    description: 'Test fixed amount discount',
    type: DiscountType.FIXED_AMOUNT_OFF,
    isActive: true,
    rules: {
      amount: 2000, // $20.00
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export const mockCart: Cart = {
  id: 'test-cart-1',
  items: [
    {
      productId: 'test-prod-1',
      productName: 'Test Laptop',
      price: 100000,
      quantity: 1,
    },
  ],
  status: CartStatus.ACTIVE,
  createdAt: Date.now(),
  lastActivityAt: Date.now(),
};

export function createMockProductsStore(): Map<string, Product> {
  return new Map(mockProducts.map((p) => [p.id, { ...p }]));
}

export function createMockDiscountsStore(): Map<string, Discount> {
  return new Map(mockDiscounts.map((d) => [d.id, { ...d }]));
}

export function createMockCartsStore(): Map<string, Cart> {
  return new Map([[mockCart.id, { ...mockCart }]]);
}
