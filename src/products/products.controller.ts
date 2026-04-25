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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
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

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({
    summary: 'List all products',
    description: 'Get all products with optional search filter',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search term to filter products by name',
  })
  @ApiResponse({
    status: 200,
    description: 'List of products returned successfully',
  })
  listProducts(@Query('search') search?: string) {
    return this.productsService.listProducts({ search });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get product by ID',
    description: 'Retrieve a single product by its ID',
  })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiResponse({ status: 200, description: 'Product found and returned' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  getProduct(@Param('id') id: string) {
    return this.productsService.getProduct(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a new product',
    description: 'Add a new product to the catalog (back-office operation)',
  })
  @ApiBody({ description: 'Product data', type: Object })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  createProduct(
    @Body(new ZodValidationPipe(createProductSchema)) body: CreateProductDto,
  ) {
    return this.productsService.createProduct(body);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update product',
    description: 'Update product details (back-office operation)',
  })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiBody({
    description: 'Updated product data (all fields optional)',
    type: Object,
  })
  @ApiResponse({ status: 200, description: 'Product updated successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  updateProduct(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateProductSchema)) body: UpdateProductDto,
  ) {
    return this.productsService.updateProduct(id, body);
  }

  @Patch(':id/stock')
  @ApiOperation({
    summary: 'Adjust product stock',
    description: 'Set new stock level for a product (back-office operation)',
  })
  @ApiParam({ name: 'id', description: 'Product ID' })
  @ApiBody({ description: 'New stock quantity', type: Object })
  @ApiResponse({ status: 200, description: 'Stock adjusted successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 400, description: 'Invalid stock value' })
  adjustStock(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(adjustStockSchema)) body: AdjustStockDto,
  ) {
    return this.productsService.adjustStock(id, body.stock);
  }
}
