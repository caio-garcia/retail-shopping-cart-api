import { Test, TestingModule } from '@nestjs/testing';
import { DiscountsController } from './discounts.controller';
import { DiscountsService } from './discounts.service';
import { Discount } from '../common/interfaces/discount.interface';

describe('DiscountsController', () => {
  let controller: DiscountsController;
  let service: DiscountsService;

  const mockDiscount: Discount = {
    id: 'discount-1',
    code: 'SAVE10',
    description: '10% off',
    type: 'percentage',
    value: 10,
    active: true,
    startDate: Date.now(),
    endDate: Date.now() + 86400000,
    conditions: {
      minPurchaseAmount: 50,
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockDiscountsService = {
    listDiscounts: jest.fn(),
    getDiscount: jest.fn(),
    createDiscount: jest.fn(),
    updateDiscount: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiscountsController],
      providers: [
        {
          provide: DiscountsService,
          useValue: mockDiscountsService,
        },
      ],
    }).compile();

    controller = module.get<DiscountsController>(DiscountsController);
    service = module.get<DiscountsService>(DiscountsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listDiscounts', () => {
    it('should return all discounts when activeOnly is not provided', () => {
      const discounts = [mockDiscount];
      mockDiscountsService.listDiscounts.mockReturnValue(discounts);

      const result = controller.listDiscounts();

      expect(result).toEqual(discounts);
      expect(service.listDiscounts).toHaveBeenCalledWith({ activeOnly: false });
    });

    it('should return only active discounts when activeOnly is true', () => {
      const discounts = [mockDiscount];
      mockDiscountsService.listDiscounts.mockReturnValue(discounts);

      const result = controller.listDiscounts('true');

      expect(result).toEqual(discounts);
      expect(service.listDiscounts).toHaveBeenCalledWith({ activeOnly: true });
    });

    it('should return all discounts when activeOnly is false', () => {
      const discounts = [mockDiscount, { ...mockDiscount, active: false }];
      mockDiscountsService.listDiscounts.mockReturnValue(discounts);

      const result = controller.listDiscounts('false');

      expect(result).toEqual(discounts);
      expect(service.listDiscounts).toHaveBeenCalledWith({ activeOnly: false });
    });
  });

  describe('getDiscount', () => {
    it('should return a discount by id', () => {
      mockDiscountsService.getDiscount.mockReturnValue(mockDiscount);

      const result = controller.getDiscount('discount-1');

      expect(result).toEqual(mockDiscount);
      expect(service.getDiscount).toHaveBeenCalledWith('discount-1');
    });
  });

  describe('createDiscount', () => {
    it('should create a new discount', () => {
      const createDto = {
        code: 'NEWCODE',
        description: '20% off',
        type: 'percentage' as const,
        value: 20,
        active: true,
        startDate: Date.now(),
        endDate: Date.now() + 86400000,
        conditions: {
          minPurchaseAmount: 100,
        },
      };
      mockDiscountsService.createDiscount.mockReturnValue(mockDiscount);

      const result = controller.createDiscount(createDto);

      expect(result).toEqual(mockDiscount);
      expect(service.createDiscount).toHaveBeenCalledWith(createDto);
    });
  });

  describe('updateDiscount', () => {
    it('should update a discount', () => {
      const updateDto = {
        description: 'Updated description',
        value: 15,
      };
      const updatedDiscount = { ...mockDiscount, ...updateDto };
      mockDiscountsService.updateDiscount.mockReturnValue(updatedDiscount);

      const result = controller.updateDiscount('discount-1', updateDto);

      expect(result).toEqual(updatedDiscount);
      expect(service.updateDiscount).toHaveBeenCalledWith(
        'discount-1',
        updateDto,
      );
    });
  });
});
