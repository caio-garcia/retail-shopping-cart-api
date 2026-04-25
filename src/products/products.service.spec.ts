import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { createMockProductsStore } from '../../test/fixtures/mock-data';
import { ProductNotFoundException } from '../common/exceptions';

describe('ProductsService', () => {
  let service: ProductsService;
  let mockStore: Map<string, any>;

  beforeEach(async () => {
    mockStore = createMockProductsStore();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        {
          provide: 'PRODUCTS_STORE',
          useValue: mockStore,
        },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  describe('listProducts', () => {
    it('should return all products', () => {
      const products = service.listProducts();
      expect(products).toHaveLength(3);
      expect(products[0].name).toBe('Test Laptop');
    });

    it('should filter products by search term', () => {
      const products = service.listProducts({ search: 'mouse' });
      expect(products).toHaveLength(1);
      expect(products[0].name).toBe('Test Mouse');
    });

    it('should return empty array when no matches', () => {
      const products = service.listProducts({ search: 'nonexistent' });
      expect(products).toHaveLength(0);
    });
  });

  describe('getProduct', () => {
    it('should return a product by id', () => {
      const product = service.getProduct('test-prod-1');
      expect(product.name).toBe('Test Laptop');
      expect(product.price).toBe(100000);
    });

    it('should throw ProductNotFoundException for invalid id', () => {
      expect(() => service.getProduct('invalid-id')).toThrow(
        ProductNotFoundException,
      );
    });
  });

  describe('createProduct', () => {
    it('should create a new product', () => {
      const input = {
        name: 'New Product',
        description: 'New description',
        price: 5000,
        stock: 20,
      };

      const product = service.createProduct(input);

      expect(product.id).toBeDefined();
      expect(product.name).toBe('New Product');
      expect(product.price).toBe(5000);
      expect(mockStore.has(product.id)).toBe(true);
    });
  });

  describe('updateProduct', () => {
    it('should update an existing product', () => {
      const updated = service.updateProduct('test-prod-1', {
        name: 'Updated Laptop',
        price: 120000,
      });

      expect(updated.name).toBe('Updated Laptop');
      expect(updated.price).toBe(120000);
      expect(updated.description).toBe('Test laptop for unit tests');
    });

    it('should throw ProductNotFoundException for invalid id', () => {
      expect(() =>
        service.updateProduct('invalid-id', { name: 'Test' }),
      ).toThrow(ProductNotFoundException);
    });
  });

  describe('adjustStock', () => {
    it('should adjust stock level', () => {
      const updated = service.adjustStock('test-prod-1', 5);
      expect(updated.stock).toBe(5);
    });

    it('should throw ProductNotFoundException for invalid id', () => {
      expect(() => service.adjustStock('invalid-id', 10)).toThrow(
        ProductNotFoundException,
      );
    });
  });

  describe('exists', () => {
    it('should return true for existing product', () => {
      expect(service.exists('test-prod-1')).toBe(true);
    });

    it('should return false for non-existing product', () => {
      expect(service.exists('invalid-id')).toBe(false);
    });
  });
});
