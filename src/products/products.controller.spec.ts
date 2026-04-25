import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { Product } from '../common/interfaces/product.interface';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: ProductsService;

  const mockProduct: Product = {
    id: 'product-1',
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    stock: 10,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const mockProductsService = {
    listProducts: jest.fn(),
    getProduct: jest.fn(),
    createProduct: jest.fn(),
    updateProduct: jest.fn(),
    adjustStock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: ProductsService,
          useValue: mockProductsService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get<ProductsService>(ProductsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('listProducts', () => {
    it('should return all products when no search query is provided', () => {
      const products = [mockProduct];
      mockProductsService.listProducts.mockReturnValue(products);

      const result = controller.listProducts();

      expect(result).toEqual(products);
      expect(service.listProducts).toHaveBeenCalledWith({});
    });

    it('should return filtered products when search query is provided', () => {
      const products = [mockProduct];
      mockProductsService.listProducts.mockReturnValue(products);

      const result = controller.listProducts('Test');

      expect(result).toEqual(products);
      expect(service.listProducts).toHaveBeenCalledWith({ search: 'Test' });
    });
  });

  describe('getProduct', () => {
    it('should return a product by id', () => {
      mockProductsService.getProduct.mockReturnValue(mockProduct);

      const result = controller.getProduct('product-1');

      expect(result).toEqual(mockProduct);
      expect(service.getProduct).toHaveBeenCalledWith('product-1');
    });
  });

  describe('createProduct', () => {
    it('should create a new product', () => {
      const createDto = {
        name: 'New Product',
        description: 'New Description',
        price: 49.99,
        stock: 5,
      };
      mockProductsService.createProduct.mockReturnValue(mockProduct);

      const result = controller.createProduct(createDto);

      expect(result).toEqual(mockProduct);
      expect(service.createProduct).toHaveBeenCalledWith(createDto);
    });
  });

  describe('updateProduct', () => {
    it('should update a product', () => {
      const updateDto = {
        name: 'Updated Product',
        price: 79.99,
      };
      const updatedProduct = { ...mockProduct, ...updateDto };
      mockProductsService.updateProduct.mockReturnValue(updatedProduct);

      const result = controller.updateProduct('product-1', updateDto);

      expect(result).toEqual(updatedProduct);
      expect(service.updateProduct).toHaveBeenCalledWith(
        'product-1',
        updateDto,
      );
    });
  });

  describe('adjustStock', () => {
    it('should adjust product stock', () => {
      const adjustDto = { stock: 20 };
      const adjustedProduct = { ...mockProduct, stock: 20 };
      mockProductsService.adjustStock.mockReturnValue(adjustedProduct);

      const result = controller.adjustStock('product-1', adjustDto);

      expect(result).toEqual(adjustedProduct);
      expect(service.adjustStock).toHaveBeenCalledWith('product-1', 20);
    });
  });
});
