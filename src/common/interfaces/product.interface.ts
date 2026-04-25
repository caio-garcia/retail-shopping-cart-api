export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // Price in cents to avoid floating-point issues
  stock: number;
  createdAt: number;
  updatedAt: number;
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  stock: number;
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
}
