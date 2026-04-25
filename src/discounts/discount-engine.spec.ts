import { applyDiscounts } from './discount-engine';
import { Cart, CartStatus } from '../common/interfaces/cart.interface';
import {
  Discount,
  DiscountType,
} from '../common/interfaces/discount.interface';

describe('Discount Engine', () => {
  describe('applyDiscounts', () => {
    it('should calculate subtotal correctly', () => {
      const cart: Cart = {
        id: 'cart-1',
        items: [
          {
            productId: 'p1',
            productName: 'Product 1',
            price: 5000,
            quantity: 2,
          },
          {
            productId: 'p2',
            productName: 'Product 2',
            price: 3000,
            quantity: 1,
          },
        ],
        status: CartStatus.ACTIVE,
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
      };

      const result = applyDiscounts(cart, []);

      expect(result.subtotal).toBe(13000); // (5000*2) + (3000*1)
      expect(result.total).toBe(13000);
      expect(result.discounts).toHaveLength(0);
    });

    it('should apply PERCENTAGE_OFF discount', () => {
      const cart: Cart = {
        id: 'cart-1',
        items: [
          {
            productId: 'p1',
            productName: 'Product 1',
            price: 10000,
            quantity: 1,
          },
        ],
        status: CartStatus.ACTIVE,
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
      };

      const discount: Discount = {
        id: 'd1',
        name: '10% Off',
        description: '',
        type: DiscountType.PERCENTAGE_OFF,
        isActive: true,
        rules: { percentage: 10 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = applyDiscounts(cart, [discount]);

      expect(result.subtotal).toBe(10000);
      expect(result.discounts[0].amount).toBe(1000); // 10% of 10000
      expect(result.total).toBe(9000);
    });

    it('should apply FIXED_AMOUNT_OFF discount', () => {
      const cart: Cart = {
        id: 'cart-1',
        items: [
          {
            productId: 'p1',
            productName: 'Product 1',
            price: 10000,
            quantity: 1,
          },
        ],
        status: CartStatus.ACTIVE,
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
      };

      const discount: Discount = {
        id: 'd1',
        name: '$20 Off',
        description: '',
        type: DiscountType.FIXED_AMOUNT_OFF,
        isActive: true,
        rules: { amount: 2000 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = applyDiscounts(cart, [discount]);

      expect(result.discounts[0].amount).toBe(2000);
      expect(result.total).toBe(8000);
    });

    it('should apply BUY_X_GET_Y discount correctly', () => {
      const cart: Cart = {
        id: 'cart-1',
        items: [
          {
            productId: 'p1',
            productName: 'Product 1',
            price: 1000,
            quantity: 6, // Buy 2 get 1 free, so 2 sets = 2 free items
          },
        ],
        status: CartStatus.ACTIVE,
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
      };

      const discount: Discount = {
        id: 'd1',
        name: 'Buy 2 Get 1 Free',
        description: '',
        type: DiscountType.BUY_X_GET_Y,
        isActive: true,
        rules: {
          buyQuantity: 2,
          getQuantity: 1,
          productId: 'p1',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = applyDiscounts(cart, [discount]);

      expect(result.discounts[0].amount).toBe(2000); // 2 * 1000
      expect(result.total).toBe(4000); // 6000 - 2000
    });

    it('should apply BULK_PRICING discount when threshold met', () => {
      const cart: Cart = {
        id: 'cart-1',
        items: [
          {
            productId: 'p1',
            productName: 'Product 1',
            price: 1000,
            quantity: 5, // Meets min quantity of 5
          },
        ],
        status: CartStatus.ACTIVE,
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
      };

      const discount: Discount = {
        id: 'd1',
        name: 'Bulk Discount',
        description: '',
        type: DiscountType.BULK_PRICING,
        isActive: true,
        rules: {
          minQuantity: 5,
          discountPercentage: 20,
          applicableProductId: 'p1',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = applyDiscounts(cart, [discount]);

      expect(result.discounts[0].amount).toBe(1000);
      expect(result.total).toBe(4000);
    });

    it('should not apply BULK_PRICING discount when threshold not met', () => {
      const cart: Cart = {
        id: 'cart-1',
        items: [
          {
            productId: 'p1',
            productName: 'Product 1',
            price: 1000,
            quantity: 3, // Below min quantity of 5
          },
        ],
        status: CartStatus.ACTIVE,
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
      };

      const discount: Discount = {
        id: 'd1',
        name: 'Bulk Discount',
        description: '',
        type: DiscountType.BULK_PRICING,
        isActive: true,
        rules: {
          minQuantity: 5,
          discountPercentage: 20,
          applicableProductId: 'p1',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = applyDiscounts(cart, [discount]);

      expect(result.discounts).toHaveLength(0);
      expect(result.total).toBe(3000);
    });

    it('should apply multiple discounts in precedence order', () => {
      const cart: Cart = {
        id: 'cart-1',
        items: [
          {
            productId: 'p1',
            productName: 'Product 1',
            price: 10000,
            quantity: 1,
          },
        ],
        status: CartStatus.ACTIVE,
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
      };

      const discounts: Discount[] = [
        {
          id: 'd1',
          name: 'Fixed Amount',
          description: '',
          type: DiscountType.FIXED_AMOUNT_OFF,
          isActive: true,
          rules: { amount: 1000 },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: 'd2',
          name: 'Percentage',
          description: '',
          type: DiscountType.PERCENTAGE_OFF,
          isActive: true,
          rules: { percentage: 10 },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];

      const result = applyDiscounts(cart, discounts);

      expect(result.discounts).toHaveLength(2);
      expect(result.total).toBe(8000);
    });

    it('should not apply discount below zero', () => {
      const cart: Cart = {
        id: 'cart-1',
        items: [
          {
            productId: 'p1',
            productName: 'Product 1',
            price: 1000,
            quantity: 1,
          },
        ],
        status: CartStatus.ACTIVE,
        createdAt: Date.now(),
        lastActivityAt: Date.now(),
      };

      const discount: Discount = {
        id: 'd1',
        name: '$50 Off',
        description: '',
        type: DiscountType.FIXED_AMOUNT_OFF,
        isActive: true,
        rules: { amount: 5000 }, // More than cart total
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const result = applyDiscounts(cart, [discount]);

      expect(result.discounts[0].amount).toBe(1000);
      expect(result.total).toBe(0);
    });
  });
});
