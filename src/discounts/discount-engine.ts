import {
  Discount,
  DiscountType,
} from '../common/interfaces/discount.interface';
import { Cart, CartItem } from '../common/interfaces/cart.interface';

export interface DiscountCalculationResult {
  discountId: string;
  discountName: string;
  amount: number;
}

export interface AppliedDiscountsResult {
  subtotal: number;
  discounts: DiscountCalculationResult[];
  total: number;
}

export function applyDiscounts(
  cart: Cart,
  activeDiscounts: Discount[],
): AppliedDiscountsResult {
  const subtotal = calculateSubtotal(cart.items);
  const discounts: DiscountCalculationResult[] = [];

  const sortedDiscounts = sortDiscountsByPrecedence(activeDiscounts);

  let runningTotal = subtotal;

  for (const discount of sortedDiscounts) {
    const discountAmount = calculateDiscountAmount(
      discount,
      cart.items,
      runningTotal,
    );

    if (discountAmount > 0) {
      discounts.push({
        discountId: discount.id,
        discountName: discount.name,
        amount: discountAmount,
      });
      runningTotal -= discountAmount;
    }
  }

  return {
    subtotal,
    discounts,
    total: Math.max(0, runningTotal),
  };
}

function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function sortDiscountsByPrecedence(discounts: Discount[]): Discount[] {
  const precedenceOrder = {
    [DiscountType.BUY_X_GET_Y]: 1,
    [DiscountType.BULK_PRICING]: 2,
    [DiscountType.PERCENTAGE_OFF]: 3,
    [DiscountType.FIXED_AMOUNT_OFF]: 4,
  };

  return [...discounts].sort(
    (a, b) => precedenceOrder[a.type] - precedenceOrder[b.type],
  );
}

function calculateDiscountAmount(
  discount: Discount,
  items: CartItem[],
  currentTotal: number,
): number {
  switch (discount.type) {
    case DiscountType.BUY_X_GET_Y:
      return calculateBuyXGetYDiscount(discount, items);
    case DiscountType.BULK_PRICING:
      return calculateBulkPricingDiscount(discount, items);
    case DiscountType.PERCENTAGE_OFF:
      return calculatePercentageOffDiscount(discount, currentTotal);
    case DiscountType.FIXED_AMOUNT_OFF:
      return calculateFixedAmountOffDiscount(discount, currentTotal);
    default:
      return 0;
  }
}

function calculateBuyXGetYDiscount(
  discount: Discount,
  items: CartItem[],
): number {
  const { buyQuantity, getQuantity, productId } = discount.rules;

  if (!buyQuantity || !getQuantity || !productId) {
    return 0;
  }

  const applicableItem = items.find((item) => item.productId === productId);
  if (!applicableItem) {
    return 0;
  }

  const totalRequired = buyQuantity + getQuantity;
  const setsQualified = Math.floor(applicableItem.quantity / totalRequired);

  const freeItems = setsQualified * getQuantity;
  return freeItems * applicableItem.price;
}

function calculateBulkPricingDiscount(
  discount: Discount,
  items: CartItem[],
): number {
  const { minQuantity, discountPercentage, applicableProductId } =
    discount.rules;

  if (!minQuantity || !discountPercentage || !applicableProductId) {
    return 0;
  }

  const applicableItem = items.find(
    (item) => item.productId === applicableProductId,
  );
  if (!applicableItem) {
    return 0;
  }

  if (applicableItem.quantity < minQuantity) {
    return 0;
  }

  const itemTotal = applicableItem.price * applicableItem.quantity;
  return Math.floor((itemTotal * discountPercentage) / 100);
}

function calculatePercentageOffDiscount(
  discount: Discount,
  currentTotal: number,
): number {
  const { percentage } = discount.rules;

  if (!percentage) {
    return 0;
  }

  return Math.floor((currentTotal * percentage) / 100);
}

function calculateFixedAmountOffDiscount(
  discount: Discount,
  currentTotal: number,
): number {
  const { amount } = discount.rules;

  if (!amount) {
    return 0;
  }

  return Math.min(amount, currentTotal);
}
