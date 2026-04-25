import { Test, TestingModule } from '@nestjs/testing';
import { DiscountsService } from './discounts.service';
import { createMockDiscountsStore } from '../../test/fixtures/mock-data';
import { DiscountNotFoundException } from '../common/exceptions';
import { DiscountType } from '../common/interfaces/discount.interface';

describe('DiscountsService', () => {
  let service: DiscountsService;
  let mockStore: Map<string, any>;

  beforeEach(async () => {
    mockStore = createMockDiscountsStore();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscountsService,
        {
          provide: 'DISCOUNTS_STORE',
          useValue: mockStore,
        },
      ],
    }).compile();

    service = module.get<DiscountsService>(DiscountsService);
  });

  describe('listDiscounts', () => {
    it('should return all discounts', () => {
      const discounts = service.listDiscounts();
      expect(discounts).toHaveLength(4);
    });

    it('should filter active discounts only', () => {
      const discounts = service.listDiscounts({ activeOnly: true });
      expect(discounts).toHaveLength(4);
      expect(discounts.every((d) => d.isActive)).toBe(true);
    });
  });

  describe('getDiscount', () => {
    it('should return a discount by id', () => {
      const discount = service.getDiscount('test-disc-1');
      expect(discount.name).toBe('Test 10% Off');
      expect(discount.type).toBe(DiscountType.PERCENTAGE_OFF);
    });

    it('should throw DiscountNotFoundException for invalid id', () => {
      expect(() => service.getDiscount('invalid-id')).toThrow(
        DiscountNotFoundException,
      );
    });
  });

  describe('createDiscount', () => {
    it('should create a new discount', () => {
      const input = {
        name: 'New Discount',
        description: 'New discount description',
        type: DiscountType.PERCENTAGE_OFF,
        isActive: true,
        rules: { percentage: 15 },
      };

      const discount = service.createDiscount(input);

      expect(discount.id).toBeDefined();
      expect(discount.name).toBe('New Discount');
      expect(mockStore.has(discount.id)).toBe(true);
    });
  });

  describe('updateDiscount', () => {
    it('should update an existing discount', () => {
      const updated = service.updateDiscount('test-disc-1', {
        name: 'Updated Discount',
        rules: { percentage: 20 },
      });

      expect(updated.name).toBe('Updated Discount');
      expect(updated.rules.percentage).toBe(20);
    });

    it('should throw DiscountNotFoundException for invalid id', () => {
      expect(() =>
        service.updateDiscount('invalid-id', { name: 'Test' }),
      ).toThrow(DiscountNotFoundException);
    });
  });

  describe('getActiveDiscounts', () => {
    it('should return only active discounts', () => {
      const discounts = service.getActiveDiscounts();
      expect(discounts.every((d) => d.isActive)).toBe(true);
    });
  });
});
