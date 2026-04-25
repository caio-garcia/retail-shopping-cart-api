import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CartsService } from './carts.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  addItemSchema,
  updateItemSchema,
  createCartSchema,
} from './schemas/cart.schema';
import type {
  AddItemDto,
  UpdateItemDto,
  CreateCartDto,
} from './schemas/cart.schema';

@ApiTags('carts')
@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new cart',
    description:
      'Create an empty cart or cart with initial items. Stock is reserved immediately.',
  })
  @ApiBody({
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
  })
  @ApiResponse({
    status: 201,
    description: 'Cart created successfully with stock reserved',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or insufficient stock',
  })
  @ApiResponse({ status: 404, description: 'Product not found' })
  createCart(@Body() body?: CreateCartDto) {
    if (!body || Object.keys(body).length === 0) {
      return this.cartsService.createCart();
    }

    try {
      const validated = createCartSchema.parse(body);
      return this.cartsService.createCart(validated.items);
    } catch (error) {
      const zodError = error as { errors?: unknown };
      throw new BadRequestException({
        message: 'Validation failed',
        errors: zodError.errors,
      });
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get cart details',
    description: 'Retrieve cart with calculated totals and applied discounts',
  })
  @ApiParam({ name: 'id', description: 'Cart ID' })
  @ApiResponse({
    status: 200,
    description: 'Cart details returned with totals',
  })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  getCart(@Param('id') id: string) {
    return this.cartsService.getCartWithTotals(id);
  }

  @Post(':id/items')
  @ApiOperation({
    summary: 'Add item to cart',
    description: 'Add a product to the cart. Stock is reserved immediately.',
  })
  @ApiParam({ name: 'id', description: 'Cart ID' })
  @ApiBody({ description: 'Product and quantity to add', type: Object })
  @ApiResponse({
    status: 200,
    description: 'Item added successfully with stock reserved',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or insufficient stock',
  })
  @ApiResponse({ status: 404, description: 'Cart or product not found' })
  addItem(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addItemSchema)) body: AddItemDto,
  ) {
    return this.cartsService.addItem(id, body);
  }

  @Put(':id/items/:productId')
  @ApiOperation({
    summary: 'Update item quantity',
    description:
      'Change quantity of an existing cart item. Stock reservations adjusted.',
  })
  @ApiParam({ name: 'id', description: 'Cart ID' })
  @ApiParam({ name: 'productId', description: 'Product ID' })
  @ApiBody({ description: 'New quantity', type: Object })
  @ApiResponse({
    status: 200,
    description: 'Item quantity updated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid quantity or insufficient stock',
  })
  @ApiResponse({ status: 404, description: 'Cart or item not found' })
  updateItem(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body(new ZodValidationPipe(updateItemSchema)) body: UpdateItemDto,
  ) {
    return this.cartsService.updateItem(id, productId, body.quantity);
  }

  @Delete(':id/items/:productId')
  @ApiOperation({
    summary: 'Remove item from cart',
    description: 'Remove a product from the cart. Stock reservations released.',
  })
  @ApiParam({ name: 'id', description: 'Cart ID' })
  @ApiParam({ name: 'productId', description: 'Product ID to remove' })
  @ApiResponse({
    status: 200,
    description: 'Item removed and stock reservation released',
  })
  @ApiResponse({ status: 404, description: 'Cart or item not found' })
  removeItem(@Param('id') id: string, @Param('productId') productId: string) {
    return this.cartsService.removeItem(id, productId);
  }

  @Post(':id/checkout')
  @ApiOperation({
    summary: 'Checkout cart',
    description:
      'Complete purchase. Stock deducted, discounts applied, cart marked as completed.',
  })
  @ApiParam({ name: 'id', description: 'Cart ID' })
  @ApiResponse({
    status: 200,
    description: 'Checkout successful with final totals',
  })
  @ApiResponse({
    status: 400,
    description: 'Cart empty, expired, or already completed',
  })
  @ApiResponse({ status: 404, description: 'Cart not found' })
  checkout(@Param('id') id: string) {
    return this.cartsService.checkout(id);
  }
}
