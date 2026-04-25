import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { loadSeedData } from '../src/common/data/bootstrap';

describe('Products API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    loadSeedData();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /products', () => {
    it('should return all products', () => {
      return request(app.getHttpServer())
        .get('/products')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[0]).toHaveProperty('price');
          expect(res.body[0]).toHaveProperty('stock');
        });
    });

    it('should filter products by search term', () => {
      return request(app.getHttpServer())
        .get('/products?search=laptop')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0].name.toLowerCase().includes('laptop')).toBe(true);
        });
    });
  });

  describe('GET /products/:id', () => {
    it('should return a specific product', () => {
      return request(app.getHttpServer())
        .get('/products/550e8400-e29b-41d4-a716-446655440001')
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe('550e8400-e29b-41d4-a716-446655440001');
          expect(res.body.name).toBeDefined();
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .get('/products/non-existent')
        .expect(404);
    });
  });

  describe('POST /products', () => {
    it('should create a new product', () => {
      const newProduct = {
        name: 'Test Product E2E',
        description: 'E2E test product',
        price: 9999,
        stock: 100,
      };

      return request(app.getHttpServer())
        .post('/products')
        .send(newProduct)
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.name).toBe(newProduct.name);
          expect(res.body.price).toBe(newProduct.price);
        });
    });

    it('should return 400 for invalid product data', () => {
      const invalidProduct = {
        name: '',
        price: -100,
      };

      return request(app.getHttpServer())
        .post('/products')
        .send(invalidProduct)
        .expect(400);
    });
  });

  describe('PUT /products/:id', () => {
    it('should update an existing product', () => {
      const updates = {
        name: 'Updated Product Name',
        price: 15000,
      };

      return request(app.getHttpServer())
        .put('/products/550e8400-e29b-41d4-a716-446655440001')
        .send(updates)
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe(updates.name);
          expect(res.body.price).toBe(updates.price);
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .put('/products/non-existent')
        .send({ name: 'Test' })
        .expect(404);
    });
  });

  describe('PATCH /products/:id/stock', () => {
    it('should adjust product stock', () => {
      return request(app.getHttpServer())
        .patch('/products/550e8400-e29b-41d4-a716-446655440002/stock')
        .send({ stock: 75 })
        .expect(200)
        .expect((res) => {
          expect(res.body.stock).toBe(75);
        });
    });

    it('should return 404 for non-existent product', () => {
      return request(app.getHttpServer())
        .patch('/products/non-existent/stock')
        .send({ stock: 10 })
        .expect(404);
    });
  });
});
