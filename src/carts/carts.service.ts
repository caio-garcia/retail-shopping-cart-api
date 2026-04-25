import { Injectable, Inject } from '@nestjs/common';
import { generateId } from '../common/utils/uuid';
import {
  Cart,
  CartItem,
  CartStatus,
  CartTotals,
  CheckoutResult,
  AddItemInput,
} from '../common/interfaces/cart.interface';
import { ProductsService } from '../products/products.service';
import { InventoryService } from '../inventory/inventory.service';
import { DiscountsService } from '../discounts/discounts.service';
import { applyDiscounts } from '../discounts/discount-engine';
import {
  CartNotFoundException,
  InvalidOperationException,
} from '../common/exceptions';

@Injectable()
export class CartsService {
  constructor(
    @Inject('CARTS_STORE')
    private readonly cartsStore: Map<string, Cart>,
    private readonly productsService: ProductsService,
    private readonly inventoryService: InventoryService,
    private readonly discountsService: DiscountsService,
  ) {}

  createCart(
    initialItems?: Array<{ productId: string; quantity: number }>,
  ): Cart {
    const now = Date.now();
    const cart: Cart = {
      id: generateId(),
      items: [],
      status: CartStatus.ACTIVE,
      createdAt: now,
      lastActivityAt: now,
    };

    // If initial items provided, validate and add them
    if (initialItems && initialItems.length > 0) {
      try {
        for (const item of initialItems) {
          // Validate product exists and get product details
          const product = this.productsService.getProduct(item.productId);

          // Check if stock is available and reserve it
          this.inventoryService.reserveStock(
            cart.id,
            item.productId,
            item.quantity,
          );

          // Add item to cart
          const cartItem: CartItem = {
            productId: product.id,
            productName: product.name,
            price: product.price,
            quantity: item.quantity,
          };
          cart.items.push(cartItem);
        }

        cart.lastActivityAt = Date.now();
      } catch (error) {
        // If any item fails, release all reservations made so far
        this.inventoryService.releaseCartReservations(cart.id);
        throw error;
      }
    }

    // Only store cart if all items were added successfully (or no items provided)
    this.cartsStore.set(cart.id, cart);
    return cart;
  }

  getCart(id: string): Cart {
    const cart = this.cartsStore.get(id);
    if (!cart) {
      throw new CartNotFoundException(id);
    }
    return cart;
  }

  getCartWithTotals(id: string): Cart & { totals: CartTotals } {
    const cart = this.getCart(id);
    const totals = this.calculateCartTotals(cart);
    return { ...cart, totals };
  }

  private calculateCartTotals(cart: Cart): CartTotals {
    const activeDiscounts = this.discountsService.getActiveDiscounts();
    const result = applyDiscounts(cart, activeDiscounts);

    return {
      subtotal: result.subtotal,
      discounts: result.discounts,
      total: result.total,
    };
  }

  addItem(cartId: string, input: AddItemInput): Cart {
    const cart = this.getCart(cartId);

    if (cart.status !== CartStatus.ACTIVE) {
      throw new InvalidOperationException(
        `Cannot add items to ${cart.status.toLowerCase()} cart`,
      );
    }

    const product = this.productsService.getProduct(input.productId);

    const existingItemIndex = cart.items.findIndex(
      (item) => item.productId === input.productId,
    );

    if (existingItemIndex >= 0) {
      const existingItem = cart.items[existingItemIndex];
      const newQuantity = existingItem.quantity + input.quantity;

      const existingReservation =
        this.inventoryService.findCartProductReservation(
          cartId,
          input.productId,
        );
      if (existingReservation) {
        this.inventoryService.updateReservation(
          existingReservation.id,
          newQuantity,
        );
      } else {
        this.inventoryService.reserveStock(
          cartId,
          input.productId,
          newQuantity,
        );
      }

      cart.items[existingItemIndex] = {
        ...existingItem,
        quantity: newQuantity,
      };
    } else {
      this.inventoryService.reserveStock(
        cartId,
        input.productId,
        input.quantity,
      );

      const newItem: CartItem = {
        productId: product.id,
        productName: product.name,
        price: product.price,
        quantity: input.quantity,
      };
      cart.items.push(newItem);
    }

    cart.lastActivityAt = Date.now();
    this.cartsStore.set(cartId, cart);

    return cart;
  }

  updateItem(cartId: string, productId: string, quantity: number): Cart {
    const cart = this.getCart(cartId);

    if (cart.status !== CartStatus.ACTIVE) {
      throw new InvalidOperationException(
        `Cannot update items in ${cart.status.toLowerCase()} cart`,
      );
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId === productId,
    );
    if (itemIndex < 0) {
      throw new InvalidOperationException(
        `Product ${productId} not found in cart`,
      );
    }

    const existingReservation =
      this.inventoryService.findCartProductReservation(cartId, productId);
    if (existingReservation) {
      this.inventoryService.updateReservation(existingReservation.id, quantity);
    } else {
      this.inventoryService.reserveStock(cartId, productId, quantity);
    }

    cart.items[itemIndex] = {
      ...cart.items[itemIndex],
      quantity,
    };

    cart.lastActivityAt = Date.now();
    this.cartsStore.set(cartId, cart);

    return cart;
  }

  removeItem(cartId: string, productId: string): Cart {
    const cart = this.getCart(cartId);

    if (cart.status !== CartStatus.ACTIVE) {
      throw new InvalidOperationException(
        `Cannot remove items from ${cart.status.toLowerCase()} cart`,
      );
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId === productId,
    );
    if (itemIndex < 0) {
      throw new InvalidOperationException(
        `Product ${productId} not found in cart`,
      );
    }

    const existingReservation =
      this.inventoryService.findCartProductReservation(cartId, productId);
    if (existingReservation) {
      this.inventoryService.releaseReservation(existingReservation.id);
    }

    cart.items.splice(itemIndex, 1);

    cart.lastActivityAt = Date.now();
    this.cartsStore.set(cartId, cart);

    return cart;
  }

  checkout(cartId: string): CheckoutResult {
    const cart = this.getCart(cartId);

    if (cart.status !== CartStatus.ACTIVE) {
      throw new InvalidOperationException(
        `Cannot checkout ${cart.status.toLowerCase()} cart`,
      );
    }

    if (cart.items.length === 0) {
      throw new InvalidOperationException('Cannot checkout empty cart');
    }

    for (const item of cart.items) {
      const product = this.productsService.getProduct(item.productId);

      if (product.stock < item.quantity) {
        throw new InvalidOperationException(
          `Insufficient stock for ${product.name}. Available: ${product.stock}, Required: ${item.quantity}`,
        );
      }
    }

    const totals = this.calculateCartTotals(cart);

    this.inventoryService.commitReservations(cartId);

    cart.status = CartStatus.COMPLETED;
    cart.lastActivityAt = Date.now();
    this.cartsStore.set(cartId, cart);

    const result: CheckoutResult = {
      cartId: cart.id,
      items: cart.items,
      subtotal: totals.subtotal,
      discounts: totals.discounts,
      total: totals.total,
      completedAt: Date.now(),
    };

    return result;
  }

  updateActivity(cartId: string): void {
    const cart = this.getCart(cartId);
    cart.lastActivityAt = Date.now();
    this.cartsStore.set(cartId, cart);
  }

  getAllCarts(): Cart[] {
    return Array.from(this.cartsStore.values());
  }

  expireCart(cartId: string): void {
    const cart = this.cartsStore.get(cartId);
    if (cart && cart.status === CartStatus.ACTIVE) {
      cart.status = CartStatus.EXPIRED;
      this.cartsStore.set(cartId, cart);
    }
  }
}
