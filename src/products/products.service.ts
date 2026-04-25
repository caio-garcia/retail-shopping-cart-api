import { Injectable, Inject } from '@nestjs/common';
import { generateId } from '../common/utils/uuid';
import {
  Product,
  CreateProductInput,
  UpdateProductInput,
} from '../common/interfaces/product.interface';
import { ProductNotFoundException } from '../common/exceptions';

@Injectable()
export class ProductsService {
  constructor(
    @Inject('PRODUCTS_STORE')
    private readonly productsStore: Map<string, Product>,
  ) {}

  listProducts(filters?: { search?: string }): Product[] {
    const allProducts = Array.from(this.productsStore.values());

    if (!filters?.search) {
      return allProducts;
    }

    const searchLower = filters.search.toLowerCase();
    return allProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(searchLower) ||
        product.description.toLowerCase().includes(searchLower),
    );
  }

  getProduct(id: string): Product {
    const product = this.productsStore.get(id);
    if (!product) {
      throw new ProductNotFoundException(id);
    }
    return product;
  }

  createProduct(input: CreateProductInput): Product {
    const now = Date.now();
    const product: Product = {
      id: generateId(),
      ...input,
      createdAt: now,
      updatedAt: now,
    };

    this.productsStore.set(product.id, product);
    return product;
  }

  updateProduct(id: string, input: UpdateProductInput): Product {
    const existing = this.getProduct(id);

    const updated: Product = {
      ...existing,
      ...input,
      updatedAt: Date.now(),
    };

    this.productsStore.set(id, updated);
    return updated;
  }

  adjustStock(id: string, newStock: number): Product {
    const existing = this.getProduct(id);

    const updated: Product = {
      ...existing,
      stock: newStock,
      updatedAt: Date.now(),
    };

    this.productsStore.set(id, updated);
    return updated;
  }

  exists(id: string): boolean {
    return this.productsStore.has(id);
  }
}
