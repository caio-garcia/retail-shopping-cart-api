import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';

export const ApiListDiscounts = () =>
  applyDecorators(
    ApiOperation({
      summary: 'List all discounts',
      description:
        'Get all discounts with optional filter for active discounts only',
    }),
    ApiQuery({
      name: 'activeOnly',
      required: false,
      description: 'Filter to show only active discounts (true/false)',
    }),
    ApiResponse({
      status: 200,
      description: 'List of discounts returned successfully',
    }),
  );

export const ApiGetDiscount = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get discount by ID',
      description: 'Retrieve a single discount by its ID',
    }),
    ApiParam({ name: 'id', description: 'Discount ID' }),
    ApiResponse({ status: 200, description: 'Discount found and returned' }),
    ApiResponse({ status: 404, description: 'Discount not found' }),
  );

export const ApiCreateDiscount = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a new discount',
      description:
        'Add a new discount rule (back-office operation). Supports 4 types: PERCENTAGE_OFF, FIXED_AMOUNT_OFF, BUY_X_GET_Y, BULK_PRICING',
    }),
    ApiBody({
      description: 'Discount data with type-specific rules',
      type: Object,
      examples: {
        percentage: {
          summary: 'Percentage off',
          value: {
            name: '10% Off Sale',
            description: '10% off everything',
            type: 'PERCENTAGE_OFF',
            isActive: true,
            rules: { percentage: 10 },
          },
        },
        fixedAmount: {
          summary: 'Fixed amount off',
          value: {
            name: '$50 Off',
            description: '$50 off total purchase',
            type: 'FIXED_AMOUNT_OFF',
            isActive: true,
            rules: { amount: 5000 },
          },
        },
        buyXGetY: {
          summary: 'Buy X Get Y',
          value: {
            name: 'Buy 2 Get 1 Free',
            description: 'Buy 2 mice, get 1 free',
            type: 'BUY_X_GET_Y',
            isActive: true,
            rules: {
              buyQuantity: 2,
              getQuantity: 1,
              productId: 'prod-mouse-001',
            },
          },
        },
        bulkPricing: {
          summary: 'Bulk pricing',
          value: {
            name: 'Bulk Discount',
            description: 'Buy 5+ laptops, get 15% off',
            type: 'BULK_PRICING',
            isActive: true,
            rules: {
              minimumQuantity: 5,
              percentage: 15,
              productId: 'prod-laptop-001',
            },
          },
        },
      },
    }),
    ApiResponse({ status: 201, description: 'Discount created successfully' }),
    ApiResponse({ status: 400, description: 'Invalid input data' }),
  );

export const ApiUpdateDiscount = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update discount',
      description:
        'Update discount details (back-office operation). All fields optional.',
    }),
    ApiParam({ name: 'id', description: 'Discount ID' }),
    ApiBody({
      description: 'Updated discount data (all fields optional)',
      type: Object,
    }),
    ApiResponse({ status: 200, description: 'Discount updated successfully' }),
    ApiResponse({ status: 404, description: 'Discount not found' }),
    ApiResponse({ status: 400, description: 'Invalid input data' }),
  );
