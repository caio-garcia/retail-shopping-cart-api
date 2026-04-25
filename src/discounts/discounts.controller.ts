import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DiscountsService } from './discounts.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  createDiscountSchema,
  updateDiscountSchema,
} from './schemas/discount.schema';
import type {
  CreateDiscountDto,
  UpdateDiscountDto,
} from './schemas/discount.schema';
import {
  ApiListDiscounts,
  ApiGetDiscount,
  ApiCreateDiscount,
  ApiUpdateDiscount,
} from './docs/discounts.docs';

@ApiTags('discounts')
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Get()
  @ApiListDiscounts()
  listDiscounts(@Query('activeOnly') activeOnly?: string) {
    return this.discountsService.listDiscounts({
      activeOnly: activeOnly === 'true',
    });
  }

  @Get(':id')
  @ApiGetDiscount()
  getDiscount(@Param('id') id: string) {
    return this.discountsService.getDiscount(id);
  }

  @Post()
  @ApiCreateDiscount()
  createDiscount(
    @Body(new ZodValidationPipe(createDiscountSchema)) body: CreateDiscountDto,
  ) {
    return this.discountsService.createDiscount(body);
  }

  @Put(':id')
  @ApiUpdateDiscount()
  updateDiscount(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateDiscountSchema)) body: UpdateDiscountDto,
  ) {
    return this.discountsService.updateDiscount(id, body);
  }
}
