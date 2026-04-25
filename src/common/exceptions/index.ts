import { HttpException, HttpStatus } from '@nestjs/common';

export class ProductNotFoundException extends HttpException {
  constructor(productId: string) {
    super(`Product with ID ${productId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class CartNotFoundException extends HttpException {
  constructor(cartId: string) {
    super(`Cart with ID ${cartId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class DiscountNotFoundException extends HttpException {
  constructor(discountId: string) {
    super(`Discount with ID ${discountId} not found`, HttpStatus.NOT_FOUND);
  }
}

export class InsufficientStockException extends HttpException {
  constructor(productName: string, available: number, requested: number) {
    super(
      `Insufficient stock for ${productName}. Available: ${available}, Requested: ${requested}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class InvalidOperationException extends HttpException {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}
