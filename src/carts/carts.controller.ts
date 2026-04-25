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
import { ApiTags } from '@nestjs/swagger';
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
import {
  ApiCreateCart,
  ApiGetCart,
  ApiAddItem,
  ApiUpdateItem,
  ApiRemoveItem,
  ApiCheckout,
} from './docs/carts.docs';

@ApiTags('carts')
@Controller('carts')
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Post()
  @ApiCreateCart()
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
  @ApiGetCart()
  getCart(@Param('id') id: string) {
    return this.cartsService.getCartWithTotals(id);
  }

  @Post(':id/items')
  @ApiAddItem()
  addItem(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addItemSchema)) body: AddItemDto,
  ) {
    return this.cartsService.addItem(id, body);
  }

  @Put(':id/items/:productId')
  @ApiUpdateItem()
  updateItem(
    @Param('id') id: string,
    @Param('productId') productId: string,
    @Body(new ZodValidationPipe(updateItemSchema)) body: UpdateItemDto,
  ) {
    return this.cartsService.updateItem(id, productId, body.quantity);
  }

  @Delete(':id/items/:productId')
  @ApiRemoveItem()
  removeItem(@Param('id') id: string, @Param('productId') productId: string) {
    return this.cartsService.removeItem(id, productId);
  }

  @Post(':id/checkout')
  @ApiCheckout()
  checkout(@Param('id') id: string) {
    return this.cartsService.checkout(id);
  }
}
