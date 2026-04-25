import { Injectable, Inject } from '@nestjs/common';
import { generateId } from '../common/utils/uuid';
import {
  Discount,
  CreateDiscountInput,
  UpdateDiscountInput,
} from '../common/interfaces/discount.interface';
import { DiscountNotFoundException } from '../common/exceptions';

@Injectable()
export class DiscountsService {
  constructor(
    @Inject('DISCOUNTS_STORE')
    private readonly discountsStore: Map<string, Discount>,
  ) {}

  listDiscounts(filters?: { activeOnly?: boolean }): Discount[] {
    const allDiscounts = Array.from(this.discountsStore.values());

    if (filters?.activeOnly) {
      return allDiscounts.filter((discount) => discount.isActive);
    }

    return allDiscounts;
  }

  getDiscount(id: string): Discount {
    const discount = this.discountsStore.get(id);
    if (!discount) {
      throw new DiscountNotFoundException(id);
    }
    return discount;
  }

  createDiscount(input: CreateDiscountInput): Discount {
    const now = Date.now();
    const discount: Discount = {
      id: generateId(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    this.discountsStore.set(discount.id, discount);
    return discount;
  }

  updateDiscount(id: string, input: UpdateDiscountInput): Discount {
    const existing = this.getDiscount(id);

    const updated: Discount = {
      ...existing,
      ...input,
      rules: input.rules
        ? { ...existing.rules, ...input.rules }
        : existing.rules,
      updatedAt: Date.now(),
    };

    this.discountsStore.set(id, updated);
    return updated;
  }

  getActiveDiscounts(): Discount[] {
    return this.listDiscounts({ activeOnly: true });
  }
}
