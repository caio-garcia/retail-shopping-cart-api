import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  createProductSchema,
  updateProductSchema,
  adjustStockSchema,
} from './schemas/product.schema';
import type {
  CreateProductDto,
  UpdateProductDto,
  AdjustStockDto,
} from './schemas/product.schema';
import {
  ApiListProducts,
  ApiGetProduct,
  ApiCreateProduct,
  ApiUpdateProduct,
  ApiAdjustStock,
} from './docs/products.docs';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiListProducts()
  listProducts(@Query('search') search?: string) {
    return this.productsService.listProducts({ search });
  }

  @Get(':id')
  @ApiGetProduct()
  getProduct(@Param('id') id: string) {
    return this.productsService.getProduct(id);
  }

  @Post()
  @ApiCreateProduct()
  createProduct(
    @Body(new ZodValidationPipe(createProductSchema)) body: CreateProductDto,
  ) {
    return this.productsService.createProduct(body);
  }

  @Put(':id')
  @ApiUpdateProduct()
  updateProduct(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProductSchema)) body: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(id, body);
  }

  @Patch(':id/stock')
  @ApiAdjustStock()
  adjustStock(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adjustStockSchema)) body: AdjustStockDto,
  ) {
    return this.productsService.adjustStock(id, body.stock);
  }
}
