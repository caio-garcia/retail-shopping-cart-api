import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';

export const ApiCreateCart = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a new cart',
      description:
        'Create an empty cart or cart with initial items. Stock is reserved immediately.',
    }),
    ApiBody({
      description: 'Optional initial items',
      required: false,
      type: Object,
      examples: {
        empty: {
          summary: 'Empty cart',
          value: {},
        },
        withItems: {
          summary: 'Cart with items',
          value: {
            items: [
              { productId: 'prod-laptop-001', quantity: 1 },
              { productId: 'prod-mouse-001', quantity: 2 },
            ],
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Cart created successfully with stock reserved',
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid input or insufficient stock',
    }),
    ApiResponse({ status: 404, description: 'Product not found' }),
  );

export const ApiGetCart = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get cart details',
      description: 'Retrieve cart with calculated totals and applied discounts',
    }),
    ApiParam({ name: 'id', description: 'Cart ID' }),
    ApiResponse({
      status: 200,
      description: 'Cart details returned with totals',
    }),
    ApiResponse({ status: 404, description: 'Cart not found' }),
  );

export const ApiAddItem = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Add item to cart',
      description: 'Add a product to the cart. Stock is reserved immediately.',
    }),
    ApiParam({ name: 'id', description: 'Cart ID' }),
    ApiBody({ description: 'Product and quantity to add', type: Object }),
    ApiResponse({
      status: 200,
      description: 'Item added successfully with stock reserved',
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid input or insufficient stock',
    }),
    ApiResponse({ status: 404, description: 'Cart or product not found' }),
  );

export const ApiUpdateItem = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update item quantity',
      description:
        'Change quantity of an existing cart item. Stock reservations adjusted.',
    }),
    ApiParam({ name: 'id', description: 'Cart ID' }),
    ApiParam({ name: 'productId', description: 'Product ID' }),
    ApiBody({ description: 'New quantity', type: Object }),
    ApiResponse({
      status: 200,
      description: 'Item quantity updated successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'Invalid quantity or insufficient stock',
    }),
    ApiResponse({ status: 404, description: 'Cart or item not found' }),
  );

export const ApiRemoveItem = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Remove item from cart',
      description:
        'Remove a product from the cart. Stock reservations released.',
    }),
    ApiParam({ name: 'id', description: 'Cart ID' }),
    ApiParam({ name: 'productId', description: 'Product ID to remove' }),
    ApiResponse({
      status: 200,
      description: 'Item removed and stock reservation released',
    }),
    ApiResponse({ status: 404, description: 'Cart or item not found' }),
  );

export const ApiCheckout = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Checkout cart',
      description:
        'Complete purchase. Stock deducted, discounts applied, cart marked as completed.',
    }),
    ApiParam({ name: 'id', description: 'Cart ID' }),
    ApiResponse({
      status: 200,
      description: 'Checkout successful with final totals',
    }),
    ApiResponse({
      status: 400,
      description: 'Cart empty, expired, or already completed',
    }),
    ApiResponse({ status: 404, description: 'Cart not found' }),
  );
