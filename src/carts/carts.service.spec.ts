import { Test, TestingModule } from '@nestjs/testing';
import { CartsService } from './carts.service';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { DiscountsService } from '../discounts/discounts.service';
import {
  createMockProductsStore,
  createMockDiscountsStore,
} from '../../test/fixtures/mock-data';
import { Cart, CartStatus } from '../common/interfaces/cart.interface';
import {
  CartNotFoundException,
  InvalidOperationException,
} from '../common/exceptions';

describe('CartsService', () => {
  let service: CartsService;
  let productsService: ProductsService;
  let inventoryService: InventoryService;
  let cartsStore: Map<string, Cart>;

  beforeEach(async () => {
    cartsStore = new Map();
    const productsStore = createMockProductsStore();
    const discountsStore = createMockDiscountsStore();
    const reservationsStore = new Map();
    const productReservationsStore = new Map();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartsService,
        ProductsService,
        InventoryService,
        DiscountsService,
        {
          provide: 'CARTS_STORE',
          useValue: cartsStore,
        },
        {
          provide: 'PRODUCTS_STORE',
          useValue: productsStore,
        },
        {
          provide: 'DISCOUNTS_STORE',
          useValue: discountsStore,
        },
        {
          provide: 'RESERVATIONS_STORE',
          useValue: reservationsStore,
        },
        {
          provide: 'PRODUCT_RESERVATIONS_STORE',
          useValue: productReservationsStore,
        },
      ],
    }).compile();

    service = module.get<CartsService>(CartsService);
    productsService = module.get<ProductsService>(ProductsService);
    inventoryService = module.get<InventoryService>(InventoryService);
  });

  describe('createCart', () => {
    it('should create an empty cart', () => {
      const cart = service.createCart();

      expect(cart.id).toBeDefined();
      expect(cart.items).toHaveLength(0);
      expect(cart.status).toBe(CartStatus.ACTIVE);
      expect(cartsStore.has(cart.id)).toBe(true);
    });

    it('should create a cart with initial items', () => {
      const cart = service.createCart([
        { productId: 'test-prod-1', quantity: 2 },
        { productId: 'test-prod-2', quantity: 1 },
      ]);

      expect(cart.id).toBeDefined();
      expect(cart.items).toHaveLength(2);
      expect(cart.status).toBe(CartStatus.ACTIVE);

      // Check first item
      expect(cart.items[0].productId).toBe('test-prod-1');
      expect(cart.items[0].quantity).toBe(2);
      expect(cart.items[0].productName).toBe('Test Laptop');
      expect(cart.items[0].price).toBe(100000);

      // Check second item
      expect(cart.items[1].productId).toBe('test-prod-2');
      expect(cart.items[1].quantity).toBe(1);
      expect(cart.items[1].productName).toBe('Test Mouse');
      expect(cart.items[1].price).toBe(2500);

      // Verify stock reservations
      expect(inventoryService.getAvailableStock('test-prod-1')).toBe(8); // 10 - 2
      expect(inventoryService.getAvailableStock('test-prod-2')).toBe(49); // 50 - 1
    });

    it('should throw error when creating cart with non-existent product', () => {
      expect(() =>
        service.createCart([{ productId: 'non-existent', quantity: 1 }]),
      ).toThrow();
    });

    it('should throw error when creating cart with insufficient stock', () => {
      expect(() =>
        service.createCart([{ productId: 'test-prod-1', quantity: 100 }]),
      ).toThrow();
    });

    it('should handle partial failures by not creating cart if any item fails', () => {
      const initialCartCount = cartsStore.size;

      expect(() =>
        service.createCart([
          { productId: 'test-prod-1', quantity: 2 },
          { productId: 'test-prod-2', quantity: 100 }, // Insufficient stock
        ]),
      ).toThrow();

      // Verify cart was not created
      expect(cartsStore.size).toBe(initialCartCount);
    });
  });

  describe('getCart', () => {
    it('should return a cart by id', () => {
      const created = service.createCart();
      const retrieved = service.getCart(created.id);

      expect(retrieved.id).toBe(created.id);
    });

    it('should throw CartNotFoundException for invalid id', () => {
      expect(() => service.getCart('invalid-id')).toThrow(
        CartNotFoundException,
      );
    });
  });

  describe('addItem', () => {
    it('should add item to cart and reserve stock', () => {
      const cart = service.createCart();
      const updated = service.addItem(cart.id, {
        productId: 'test-prod-1',
        quantity: 2,
      });

      expect(updated.items).toHaveLength(1);
      expect(updated.items[0].productId).toBe('test-prod-1');
      expect(updated.items[0].quantity).toBe(2);

      const available = inventoryService.getAvailableStock('test-prod-1');
      expect(available).toBe(8); // 10 - 2
    });

    it('should update quantity if item already in cart', () => {
      const cart = service.createCart();
      service.addItem(cart.id, {
        productId: 'test-prod-1',
        quantity: 2,
      });
      const updated = service.addItem(cart.id, {
        productId: 'test-prod-1',
        quantity: 3,
      });

      expect(updated.items).toHaveLength(1);
      expect(updated.items[0].quantity).toBe(5); // 2 + 3
    });

    it('should throw error when adding to non-active cart', () => {
      const cart = service.createCart();
      service.expireCart(cart.id);

      expect(() =>
        service.addItem(cart.id, {
          productId: 'test-prod-1',
          quantity: 1,
        }),
      ).toThrow(InvalidOperationException);
    });
  });

  describe('updateItem', () => {
    it('should update item quantity', () => {
      const cart = service.createCart();
      service.addItem(cart.id, {
        productId: 'test-prod-1',
        quantity: 2,
      });

      const updated = service.updateItem(cart.id, 'test-prod-1', 5);

      expect(updated.items[0].quantity).toBe(5);
      expect(inventoryService.getAvailableStock('test-prod-1')).toBe(5); // 10 - 5
    });

    it('should throw error when item not in cart', () => {
      const cart = service.createCart();

      expect(() => service.updateItem(cart.id, 'test-prod-1', 5)).toThrow(
        InvalidOperationException,
      );
    });
  });

  describe('removeItem', () => {
    it('should remove item and release reservation', () => {
      const cart = service.createCart();
      service.addItem(cart.id, {
        productId: 'test-prod-1',
        quantity: 2,
      });

      const updated = service.removeItem(cart.id, 'test-prod-1');

      expect(updated.items).toHaveLength(0);
      expect(inventoryService.getAvailableStock('test-prod-1')).toBe(10);
    });

    it('should throw error when item not in cart', () => {
      const cart = service.createCart();

      expect(() => service.removeItem(cart.id, 'test-prod-1')).toThrow(
        InvalidOperationException,
      );
    });

    it('should throw error when removing from non-active cart', () => {
      const cart = service.createCart();
      service.addItem(cart.id, {
        productId: 'test-prod-1',
        quantity: 1,
      });
      service.checkout(cart.id);

      expect(() => service.removeItem(cart.id, 'test-prod-1')).toThrow(
        InvalidOperationException,
      );
    });
  });

  describe('checkout', () => {
    it('should checkout cart successfully', () => {
      const cart = service.createCart();
      service.addItem(cart.id, {
        productId: 'test-prod-1',
        quantity: 1,
      });

      const result = service.checkout(cart.id);

      expect(result.cartId).toBe(cart.id);
      expect(result.items).toHaveLength(1);
      expect(result.subtotal).toBe(100000);
      expect(result.total).toBeLessThanOrEqual(result.subtotal);
      expect(result.completedAt).toBeDefined();

      const completedCart = service.getCart(cart.id);
      expect(completedCart.status).toBe(CartStatus.COMPLETED);

      const product = productsService.getProduct('test-prod-1');
      expect(product.stock).toBe(9); // 10 - 1
    });

    it('should apply discounts during checkout', () => {
      const cart = service.createCart();
      service.addItem(cart.id, {
        productId: 'test-prod-1',
        quantity: 1,
      });

      const result = service.checkout(cart.id);

      expect(result.discounts.length).toBeGreaterThan(0);
      expect(result.total).toBeLessThan(result.subtotal);
    });

    it('should throw error when checking out empty cart', () => {
      const cart = service.createCart();

      expect(() => service.checkout(cart.id)).toThrow(
        InvalidOperationException,
      );
    });

    it('should throw error when checking out non-active cart', () => {
      const cart = service.createCart();
      service.addItem(cart.id, {
        productId: 'test-prod-1',
        quantity: 1,
      });
      service.checkout(cart.id);

      expect(() => service.checkout(cart.id)).toThrow(
        InvalidOperationException,
      );
    });

    it('should throw error when insufficient stock during checkout', () => {
      const cart = service.createCart();
      service.addItem(cart.id, {
        productId: 'test-prod-1',
        quantity: 1,
      });

      // Manually reduce product stock below cart requirement
      productsService.adjustStock('test-prod-1', 0);

      expect(() => service.checkout(cart.id)).toThrow(
        InvalidOperationException,
      );
    });
  });

  describe('getCartWithTotals', () => {
    it('should return cart with calculated totals', () => {
      const cart = service.createCart();
      service.addItem(cart.id, {
        productId: 'test-prod-1',
        quantity: 1,
      });

      const result = service.getCartWithTotals(cart.id);

      expect(result.totals).toBeDefined();
      expect(result.totals.subtotal).toBe(100000);
      expect(result.totals.discounts).toBeDefined();
      expect(result.totals.total).toBeDefined();
    });
  });

  describe('expireCart', () => {
    it('should mark active cart as expired', () => {
      const cart = service.createCart();
      service.expireCart(cart.id);

      const expired = service.getCart(cart.id);
      expect(expired.status).toBe(CartStatus.EXPIRED);
    });

    it('should not affect non-active carts', () => {
      const cart = service.createCart();
      service.addItem(cart.id, {
        productId: 'test-prod-1',
        quantity: 1,
      });
      service.checkout(cart.id);

      service.expireCart(cart.id);

      const stillCompleted = service.getCart(cart.id);
      expect(stillCompleted.status).toBe(CartStatus.COMPLETED);
    });
  });
});
