import { Test, TestingModule } from '@nestjs/testing';
import {
  CartTimeoutService,
  findInactiveCarts,
  cleanupCart,
} from './cart-timeout.service';
import { CartStatus } from '../common/interfaces/cart.interface';
import { InventoryService } from '../inventory/inventory.service';
import { CartsService } from './carts.service';

describe('CartTimeoutService', () => {
  let service: CartTimeoutService;
  let cartsService: CartsService;
  let inventoryService: InventoryService;

  beforeEach(async () => {
    const mockCartsService = {
      getAllCarts: jest.fn(),
      expireCart: jest.fn(),
    };

    const mockInventoryService = {
      releaseCartReservations: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartTimeoutService,
        {
          provide: CartsService,
          useValue: mockCartsService,
        },
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
      ],
    }).compile();

    service = module.get<CartTimeoutService>(CartTimeoutService);
    cartsService = module.get<CartsService>(CartsService);
    inventoryService = module.get<InventoryService>(InventoryService);
  });

  describe('handleCartTimeouts', () => {
    it('should process inactive carts', () => {
      const now = Date.now();
      const inactiveCarts = [
        {
          id: 'cart-1',
          status: CartStatus.ACTIVE,
          lastActivityAt: now - 3 * 60 * 1000,
          items: [],
        },
      ];

      jest.spyOn(cartsService, 'getAllCarts').mockReturnValue(inactiveCarts);

      service.handleCartTimeouts();

      expect(inventoryService.releaseCartReservations).toHaveBeenCalledWith(
        'cart-1',
      );
      expect(cartsService.expireCart).toHaveBeenCalledWith('cart-1');
    });

    it('should not process when no inactive carts', () => {
      const now = Date.now();
      const activeCarts = [
        {
          id: 'cart-1',
          status: CartStatus.ACTIVE,
          lastActivityAt: now - 1 * 60 * 1000,
          items: [],
        },
      ];

      jest.spyOn(cartsService, 'getAllCarts').mockReturnValue(activeCarts);

      service.handleCartTimeouts();

      expect(inventoryService.releaseCartReservations).not.toHaveBeenCalled();
      expect(cartsService.expireCart).not.toHaveBeenCalled();
    });

    it('should handle empty cart list', () => {
      jest.spyOn(cartsService, 'getAllCarts').mockReturnValue([]);

      service.handleCartTimeouts();

      expect(inventoryService.releaseCartReservations).not.toHaveBeenCalled();
      expect(cartsService.expireCart).not.toHaveBeenCalled();
    });
  });

  describe('findInactiveCarts', () => {
    it('should find carts inactive for more than timeout', () => {
      const now = Date.now();
      const timeoutMs = 2 * 60 * 1000; // 2 minutes

      const carts = [
        {
          id: 'cart-1',
          status: CartStatus.ACTIVE,
          lastActivityAt: now - 3 * 60 * 1000, // 3 minutes ago (inactive)
        },
        {
          id: 'cart-2',
          status: CartStatus.ACTIVE,
          lastActivityAt: now - 1 * 60 * 1000, // 1 minute ago (active)
        },
        {
          id: 'cart-3',
          status: CartStatus.COMPLETED,
          lastActivityAt: now - 5 * 60 * 1000, // 5 minutes ago but completed
        },
      ];

      const inactive = findInactiveCarts(carts, now, timeoutMs);

      expect(inactive).toHaveLength(1);
      expect(inactive[0]?.id).toBe('cart-1');
    });

    it('should return empty array when no inactive carts', () => {
      const now = Date.now();
      const timeoutMs = 2 * 60 * 1000;

      const carts = [
        {
          id: 'cart-1',
          status: CartStatus.ACTIVE,
          lastActivityAt: now - 1 * 60 * 1000, // 1 minute ago
        },
      ];

      const inactive = findInactiveCarts(carts, now, timeoutMs);

      expect(inactive).toHaveLength(0);
    });

    it('should only consider active carts', () => {
      const now = Date.now();
      const timeoutMs = 2 * 60 * 1000;

      const carts = [
        {
          id: 'cart-1',
          status: CartStatus.EXPIRED,
          lastActivityAt: now - 5 * 60 * 1000,
        },
        {
          id: 'cart-2',
          status: CartStatus.COMPLETED,
          lastActivityAt: now - 5 * 60 * 1000,
        },
      ];

      const inactive = findInactiveCarts(carts, now, timeoutMs);

      expect(inactive).toHaveLength(0);
    });
  });

  describe('cleanupCart', () => {
    it('should release reservations and expire cart', () => {
      const mockInventoryService = {
        releaseCartReservations: jest.fn(),
      } as any as InventoryService;

      const mockCartsService = {
        expireCart: jest.fn(),
      } as any as CartsService;

      cleanupCart('cart-1', mockInventoryService, mockCartsService);

      expect(mockInventoryService.releaseCartReservations).toHaveBeenCalledWith(
        'cart-1',
      );
      expect(mockCartsService.expireCart).toHaveBeenCalledWith('cart-1');
    });
  });
});
