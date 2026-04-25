import { Test, TestingModule } from '@nestjs/testing';
import { CartsController } from './carts.controller';
import { CartsService } from './carts.service';
import { Cart } from '../common/interfaces/cart.interface';

describe('CartsController', () => {
  let controller: CartsController;
  let service: CartsService;

  const mockCart: Cart = {
    id: 'cart-1',
    items: [
      {
        productId: 'product-1',
        productName: 'Test Product',
        price: 99.99,
        quantity: 2,
      },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastActivityAt: Date.now(),
  };

  const mockCartWithTotals = {
    ...mockCart,
    subtotal: 199.98,
    discount: 0,
    total: 199.98,
    appliedDiscounts: [],
  };

  const mockCartsService = {
    createCart: jest.fn(),
    getCartWithTotals: jest.fn(),
    addItem: jest.fn(),
    updateItem: jest.fn(),
    removeItem: jest.fn(),
    checkout: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartsController],
      providers: [
        {
          provide: CartsService,
          useValue: mockCartsService,
        },
      ],
    }).compile();

    controller = module.get<CartsController>(CartsController);
    service = module.get<CartsService>(CartsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createCart', () => {
    it('should create a new empty cart', () => {
      mockCartsService.createCart.mockReturnValue(mockCart);

      const result = controller.createCart();

      expect(result).toEqual(mockCart);
      expect(service.createCart).toHaveBeenCalled();
    });

    it('should create a cart with initial items', () => {
      const createCartDto = {
        items: [
          { productId: 'product-1', quantity: 2 },
          { productId: 'product-2', quantity: 1 },
        ],
      };
      mockCartsService.createCart.mockReturnValue(mockCart);

      const result = controller.createCart(createCartDto);

      expect(result).toEqual(mockCart);
      expect(service.createCart).toHaveBeenCalledWith(createCartDto.items);
    });
  });

  describe('getCart', () => {
    it('should return a cart with totals', () => {
      mockCartsService.getCartWithTotals.mockReturnValue(mockCartWithTotals);

      const result = controller.getCart('cart-1');

      expect(result).toEqual(mockCartWithTotals);
      expect(service.getCartWithTotals).toHaveBeenCalledWith('cart-1');
    });
  });

  describe('addItem', () => {
    it('should add an item to the cart', () => {
      const addItemDto = {
        productId: 'product-2',
        quantity: 1,
      };
      mockCartsService.addItem.mockReturnValue(mockCartWithTotals);

      const result = controller.addItem('cart-1', addItemDto);

      expect(result).toEqual(mockCartWithTotals);
      expect(service.addItem).toHaveBeenCalledWith('cart-1', addItemDto);
    });
  });

  describe('updateItem', () => {
    it('should update an item quantity in the cart', () => {
      const updateItemDto = { quantity: 3 };
      mockCartsService.updateItem.mockReturnValue(mockCartWithTotals);

      const result = controller.updateItem(
        'cart-1',
        'product-1',
        updateItemDto,
      );

      expect(result).toEqual(mockCartWithTotals);
      expect(service.updateItem).toHaveBeenCalledWith('cart-1', 'product-1', 3);
    });
  });

  describe('removeItem', () => {
    it('should remove an item from the cart', () => {
      mockCartsService.removeItem.mockReturnValue(mockCartWithTotals);

      const result = controller.removeItem('cart-1', 'product-1');

      expect(result).toEqual(mockCartWithTotals);
      expect(service.removeItem).toHaveBeenCalledWith('cart-1', 'product-1');
    });
  });

  describe('checkout', () => {
    it('should checkout the cart', () => {
      const checkoutResult = {
        ...mockCartWithTotals,
        status: 'completed',
      };
      mockCartsService.checkout.mockReturnValue(checkoutResult);

      const result = controller.checkout('cart-1');

      expect(result).toEqual(checkoutResult);
      expect(service.checkout).toHaveBeenCalledWith('cart-1');
    });
  });
});
