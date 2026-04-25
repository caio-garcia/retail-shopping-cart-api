import { Test, TestingModule } from '@nestjs/testing';
import { InventoryService } from './inventory.service';
import { ProductsService } from '../products/products.service';
import { createMockProductsStore } from '../../test/fixtures/mock-data';
import { InsufficientStockException } from '../common/exceptions';
import { StockReservation } from '../common/interfaces/reservation.interface';

describe('InventoryService', () => {
  let service: InventoryService;
  let productsService: ProductsService;
  let reservationsStore: Map<string, StockReservation>;
  let productReservationsStore: Map<string, Set<string>>;

  beforeEach(async () => {
    reservationsStore = new Map();
    productReservationsStore = new Map();
    const productsStore = createMockProductsStore();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        ProductsService,
        {
          provide: 'RESERVATIONS_STORE',
          useValue: reservationsStore,
        },
        {
          provide: 'PRODUCT_RESERVATIONS_STORE',
          useValue: productReservationsStore,
        },
        {
          provide: 'PRODUCTS_STORE',
          useValue: productsStore,
        },
      ],
    }).compile();

    service = module.get<InventoryService>(InventoryService);
    productsService = module.get<ProductsService>(ProductsService);
  });

  describe('getAvailableStock', () => {
    it('should return total stock when no reservations', () => {
      const available = service.getAvailableStock('test-prod-1');
      expect(available).toBe(10);
    });

    it('should return available stock after reservation', () => {
      service.reserveStock('cart-1', 'test-prod-1', 3);
      const available = service.getAvailableStock('test-prod-1');
      expect(available).toBe(7);
    });

    it('should handle multiple reservations', () => {
      service.reserveStock('cart-1', 'test-prod-1', 3);
      service.reserveStock('cart-2', 'test-prod-1', 2);
      const available = service.getAvailableStock('test-prod-1');
      expect(available).toBe(5);
    });
  });

  describe('reserveStock', () => {
    it('should create a stock reservation', () => {
      const reservation = service.reserveStock('cart-1', 'test-prod-1', 5);

      expect(reservation.id).toBeDefined();
      expect(reservation.cartId).toBe('cart-1');
      expect(reservation.productId).toBe('test-prod-1');
      expect(reservation.quantity).toBe(5);
      expect(reservationsStore.has(reservation.id)).toBe(true);
    });

    it('should throw InsufficientStockException when not enough stock', () => {
      expect(() => service.reserveStock('cart-1', 'test-prod-1', 20)).toThrow(
        InsufficientStockException,
      );
    });

    it('should respect existing reservations when checking stock', () => {
      service.reserveStock('cart-1', 'test-prod-1', 8);

      expect(() => service.reserveStock('cart-2', 'test-prod-1', 5)).toThrow(
        InsufficientStockException,
      );
    });
  });

  describe('releaseReservation', () => {
    it('should release a reservation', () => {
      const reservation = service.reserveStock('cart-1', 'test-prod-1', 3);
      service.releaseReservation(reservation.id);

      expect(reservationsStore.has(reservation.id)).toBe(false);
      expect(service.getAvailableStock('test-prod-1')).toBe(10);
    });

    it('should handle releasing non-existent reservation gracefully', () => {
      expect(() => service.releaseReservation('invalid-id')).not.toThrow();
    });
  });

  describe('releaseCartReservations', () => {
    it('should release all reservations for a cart', () => {
      service.reserveStock('cart-1', 'test-prod-1', 3);
      service.reserveStock('cart-1', 'test-prod-2', 2);

      service.releaseCartReservations('cart-1');

      expect(service.getAvailableStock('test-prod-1')).toBe(10);
      expect(service.getAvailableStock('test-prod-2')).toBe(50);
    });
  });

  describe('commitReservations', () => {
    it('should deduct reserved stock from product inventory', () => {
      service.reserveStock('cart-1', 'test-prod-1', 3);
      service.reserveStock('cart-1', 'test-prod-2', 5);

      service.commitReservations('cart-1');

      const product1 = productsService.getProduct('test-prod-1');
      const product2 = productsService.getProduct('test-prod-2');

      expect(product1.stock).toBe(7);
      expect(product2.stock).toBe(45);
      expect(service.getAvailableStock('test-prod-1')).toBe(7);
    });

    it('should release reservations after committing', () => {
      const reservation = service.reserveStock('cart-1', 'test-prod-1', 3);
      service.commitReservations('cart-1');

      expect(reservationsStore.has(reservation.id)).toBe(false);
    });
  });

  describe('updateReservation', () => {
    it('should update an existing reservation', () => {
      const reservation = service.reserveStock('cart-1', 'test-prod-1', 3);

      const updatedReservation = service.updateReservation(reservation.id, 5);

      expect(updatedReservation.quantity).toBe(5);
      expect(updatedReservation.cartId).toBe('cart-1');
      expect(updatedReservation.productId).toBe('test-prod-1');
      expect(service.getAvailableStock('test-prod-1')).toBe(5);
    });

    it('should throw error when reservation not found', () => {
      expect(() => service.updateReservation('non-existent-id', 5)).toThrow(
        'Reservation non-existent-id not found',
      );
    });
  });

  describe('concurrency scenarios', () => {
    it('should handle concurrent reservations correctly', () => {
      const productId = 'test-prod-3';

      service.reserveStock('cart-1', productId, 3);

      const reservation2 = service.reserveStock('cart-2', productId, 2);
      expect(reservation2).toBeDefined();

      expect(() => service.reserveStock('cart-3', productId, 1)).toThrow(
        InsufficientStockException,
      );
    });
  });
});
