import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CartsService } from './carts.service';
import { InventoryService } from '../inventory/inventory.service';
import { CartStatus } from '../common/interfaces/cart.interface';

const CART_TIMEOUT_MS = 2 * 60 * 1000;

@Injectable()
export class CartTimeoutService {
  constructor(
    private readonly cartsService: CartsService,
    private readonly inventoryService: InventoryService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  handleCartTimeouts() {
    const now = Date.now();
    const allCarts = this.cartsService.getAllCarts();

    const inactiveCarts = findInactiveCarts(allCarts, now, CART_TIMEOUT_MS);

    if (inactiveCarts.length > 0) {
      console.log(`⏱️  Processing ${inactiveCarts.length} inactive cart(s)...`);

      for (const cart of inactiveCarts) {
        cleanupCart(cart.id, this.inventoryService, this.cartsService);
      }
    }
  }
}

export function findInactiveCarts(
  carts: { id: string; status: CartStatus; lastActivityAt: number }[],
  currentTime: number,
  timeoutMs: number,
): { id: string; status: CartStatus; lastActivityAt: number }[] {
  return carts.filter((cart) => {
    if (cart.status !== CartStatus.ACTIVE) {
      return false;
    }

    const inactiveTime = currentTime - cart.lastActivityAt;
    return inactiveTime > timeoutMs;
  });
}

export function cleanupCart(
  cartId: string,
  inventoryService: InventoryService,
  cartsService: CartsService,
): void {
  inventoryService.releaseCartReservations(cartId);

  cartsService.expireCart(cartId);

  console.log(`   ✓ Cart ${cartId} expired and reservations released`);
}
