import { Injectable, Inject } from '@nestjs/common';
import { generateId } from '../common/utils/uuid';
import { StockReservation } from '../common/interfaces/reservation.interface';
import { ProductsService } from '../products/products.service';
import { InsufficientStockException } from '../common/exceptions';

@Injectable()
export class InventoryService {
  constructor(
    @Inject('RESERVATIONS_STORE')
    private readonly reservationsStore: Map<string, StockReservation>,
    @Inject('PRODUCT_RESERVATIONS_STORE')
    private readonly productReservationsStore: Map<string, Set<string>>,
    private readonly productsService: ProductsService,
  ) {}

  getAvailableStock(productId: string): number {
    const product = this.productsService.getProduct(productId);
    const reservedQuantity = this.getReservedQuantity(productId);
    return Math.max(0, product.stock - reservedQuantity);
  }

  private getReservedQuantity(productId: string): number {
    const reservationIds = this.productReservationsStore.get(productId);
    if (!reservationIds) {
      return 0;
    }

    let total = 0;
    reservationIds.forEach((reservationId) => {
      const reservation = this.reservationsStore.get(reservationId);
      if (reservation) {
        total += reservation.quantity;
      }
    });

    return total;
  }

  reserveStock(
    cartId: string,
    productId: string,
    quantity: number,
  ): StockReservation {
    const product = this.productsService.getProduct(productId);
    const availableStock = this.getAvailableStock(productId);

    if (availableStock < quantity) {
      throw new InsufficientStockException(
        product.name,
        availableStock,
        quantity,
      );
    }

    const reservation: StockReservation = {
      id: generateId(),
      cartId,
      productId,
      quantity,
      createdAt: Date.now(),
    };

    this.reservationsStore.set(reservation.id, reservation);

    if (!this.productReservationsStore.has(productId)) {
      this.productReservationsStore.set(productId, new Set());
    }
    this.productReservationsStore.get(productId)!.add(reservation.id);

    return reservation;
  }

  releaseReservation(reservationId: string): void {
    const reservation = this.reservationsStore.get(reservationId);
    if (!reservation) {
      return;
    }

    const productReservations = this.productReservationsStore.get(
      reservation.productId,
    );
    if (productReservations) {
      productReservations.delete(reservationId);
      if (productReservations.size === 0) {
        this.productReservationsStore.delete(reservation.productId);
      }
    }

    this.reservationsStore.delete(reservationId);
  }

  releaseCartReservations(cartId: string): void {
    const reservationsToRelease: string[] = [];

    this.reservationsStore.forEach((reservation, reservationId) => {
      if (reservation.cartId === cartId) {
        reservationsToRelease.push(reservationId);
      }
    });

    reservationsToRelease.forEach((reservationId) => {
      this.releaseReservation(reservationId);
    });
  }

  getCartReservations(cartId: string): StockReservation[] {
    const reservations: StockReservation[] = [];

    this.reservationsStore.forEach((reservation) => {
      if (reservation.cartId === cartId) {
        reservations.push(reservation);
      }
    });

    return reservations;
  }

  updateReservation(
    reservationId: string,
    newQuantity: number,
  ): StockReservation {
    const oldReservation = this.reservationsStore.get(reservationId);
    if (!oldReservation) {
      throw new Error(`Reservation ${reservationId} not found`);
    }

    this.releaseReservation(reservationId);

    return this.reserveStock(
      oldReservation.cartId,
      oldReservation.productId,
      newQuantity,
    );
  }

  commitReservations(cartId: string): void {
    const reservations = this.getCartReservations(cartId);

    const productQuantities = new Map<string, number>();
    reservations.forEach((reservation) => {
      const currentQty = productQuantities.get(reservation.productId) || 0;
      productQuantities.set(
        reservation.productId,
        currentQty + reservation.quantity,
      );
    });

    productQuantities.forEach((quantity, productId) => {
      const product = this.productsService.getProduct(productId);
      const newStock = Math.max(0, product.stock - quantity);
      this.productsService.adjustStock(productId, newStock);
    });

    this.releaseCartReservations(cartId);
  }

  findCartProductReservation(
    cartId: string,
    productId: string,
  ): StockReservation | null {
    const reservations = this.getCartReservations(cartId);
    return reservations.find((r) => r.productId === productId) || null;
  }
}
