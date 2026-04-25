import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

export const ApiListProducts = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List all products',
      description: 'Get all products with optional search filter',
    }),
    ApiQuery({
      name: 'search',
      required: false,
      description: 'Search term to filter products by name',
    }),
    ApiResponse({
      status: 200,
      description: 'List of products returned successfully',
    }),
  );

export const ApiGetProduct = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get product by ID',
      description: 'Retrieve a single product by its ID',
    }),
    ApiParam({ name: 'id', description: 'Product ID' }),
    ApiResponse({ status: 200, description: 'Product found and returned' }),
    ApiResponse({ status: 404, description: 'Product not found' }),
  );

export const ApiCreateProduct = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a new product',
      description: 'Add a new product to the catalog (back-office operation)',
    }),
    ApiBody({ description: 'Product data', type: Object }),
    ApiResponse({ status: 201, description: 'Product created successfully' }),
    ApiResponse({ status: 400, description: 'Invalid input data' }),
  );

export const ApiUpdateProduct = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update product',
      description: 'Update product details (back-office operation)',
    }),
    ApiParam({ name: 'id', description: 'Product ID' }),
    ApiBody({
      description: 'Updated product data (all fields optional)',
      type: Object,
    }),
    ApiResponse({ status: 200, description: 'Product updated successfully' }),
    ApiResponse({ status: 404, description: 'Product not found' }),
    ApiResponse({ status: 400, description: 'Invalid input data' }),
  );

export const ApiAdjustStock = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Adjust product stock',
      description: 'Set new stock level for a product (back-office operation)',
    }),
    ApiParam({ name: 'id', description: 'Product ID' }),
    ApiBody({ description: 'New stock quantity', type: Object }),
    ApiResponse({ status: 200, description: 'Stock adjusted successfully' }),
    ApiResponse({ status: 404, description: 'Product not found' }),
    ApiResponse({ status: 400, description: 'Invalid stock value' }),
  );
