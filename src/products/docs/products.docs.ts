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
    ApiBody({
      description: 'Product data',
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'Wireless Keyboard',
            description: 'Product name',
          },
          description: {
            type: 'string',
            example: 'Ergonomic wireless keyboard with RGB backlight',
            description: 'Product description',
          },
          price: {
            type: 'number',
            example: 7999,
            description: 'Price in cents (e.g., 7999 = $79.99)',
          },
          stock: {
            type: 'number',
            example: 50,
            description: 'Initial stock quantity',
          },
        },
        required: ['name', 'description', 'price', 'stock'],
      },
    }),
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
      schema: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            example: 'Updated Product Name',
            description: 'Product name',
          },
          description: {
            type: 'string',
            example: 'Updated product description',
            description: 'Product description',
          },
          price: {
            type: 'number',
            example: 8999,
            description: 'Price in cents',
          },
          stock: {
            type: 'number',
            example: 75,
            description: 'Stock quantity',
          },
        },
      },
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
    ApiBody({
      description: 'New stock quantity',
      schema: {
        type: 'object',
        properties: {
          stock: {
            type: 'number',
            example: 100,
            description: 'New stock quantity (non-negative integer)',
          },
        },
        required: ['stock'],
      },
    }),
    ApiResponse({ status: 200, description: 'Stock adjusted successfully' }),
    ApiResponse({ status: 404, description: 'Product not found' }),
    ApiResponse({ status: 400, description: 'Invalid stock value' }),
  );
