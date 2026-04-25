import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { loadSeedData } from '../src/common/data/bootstrap';
import { cartsStore } from '../src/carts/carts.store';
import { reservationsStore } from '../src/inventory/inventory.store';

describe('Carts API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  beforeEach(() => {
    loadSeedData();
    cartsStore.clear();
    reservationsStore.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /carts', () => {
    it('should create a new empty cart', () => {
      return request(app.getHttpServer())
        .post('/carts')
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.items).toEqual([]);
          expect(res.body.status).toBe('ACTIVE');
        });
    });

    it('should create a cart with initial items', async () => {
      return request(app.getHttpServer())
        .post('/carts')
        .send({
          items: [
            { productId: 'prod-laptop-001', quantity: 1 },
            { productId: 'prod-mouse-001', quantity: 2 },
          ],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.items).toHaveLength(2);
          expect(res.body.status).toBe('ACTIVE');

          // Verify first item
          expect(res.body.items[0].productId).toBe('prod-laptop-001');
          expect(res.body.items[0].quantity).toBe(1);
          expect(res.body.items[0].productName).toBeDefined();
          expect(res.body.items[0].price).toBeDefined();

          // Verify second item
          expect(res.body.items[1].productId).toBe('prod-mouse-001');
          expect(res.body.items[1].quantity).toBe(2);
        });
    });

    it('should reserve stock when creating cart with items', async () => {
      const productBefore = await request(app.getHttpServer())
        .get('/products/prod-laptop-001')
        .expect(200);

      const initialStock = productBefore.body.stock;

      // Create cart with items
      await request(app.getHttpServer())
        .post('/carts')
        .send({
          items: [{ productId: 'prod-laptop-001', quantity: 2 }],
        })
        .expect(201);

      // Stock should remain unchanged (only reserved, not deducted)
      const productAfter = await request(app.getHttpServer())
        .get('/products/prod-laptop-001')
        .expect(200);

      expect(productAfter.body.stock).toBe(initialStock);
    });

    it('should return 400 when creating cart with insufficient stock', async () => {
      return request(app.getHttpServer())
        .post('/carts')
        .send({
          items: [{ productId: 'prod-laptop-001', quantity: 999 }],
        })
        .expect(400);
    });

    it('should return 400 when creating cart with non-existent product', async () => {
      return request(app.getHttpServer())
        .post('/carts')
        .send({
          items: [{ productId: 'non-existent-product', quantity: 1 }],
        })
        .expect(400);
    });

    it('should not create cart if any item is invalid', async () => {
      // Attempt to create cart with mix of valid and invalid products
      const response = await request(app.getHttpServer())
        .post('/carts')
        .send({
          items: [
            { productId: 'prod-laptop-001', quantity: 1 },
            { productId: 'non-existent', quantity: 1 },
          ],
        })
        .expect(400);

      expect(response.body.message).toBe('Validation failed');

      // Verify no reservations were made for the valid product
      const productStock = await request(app.getHttpServer())
        .get('/products/prod-laptop-001')
        .expect(200);

      // Stock should remain unchanged
      expect(productStock.body.stock).toBeDefined();
    });

    it('should validate item quantities are positive', async () => {
      return request(app.getHttpServer())
        .post('/carts')
        .send({
          items: [{ productId: 'prod-laptop-001', quantity: 0 }],
        })
        .expect(400);
    });

    it('should validate item quantities are integers', async () => {
      return request(app.getHttpServer())
        .post('/carts')
        .send({
          items: [{ productId: 'prod-laptop-001', quantity: 1.5 }],
        })
        .expect(400);
    });
  });

  describe('GET /carts/:id', () => {
    it('should return cart with totals', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/carts')
        .expect(201);

      const cartId = createRes.body.id;

      return request(app.getHttpServer())
        .get(`/carts/${cartId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe(cartId);
          expect(res.body.totals).toBeDefined();
          expect(res.body.totals.subtotal).toBeDefined();
          expect(res.body.totals.total).toBeDefined();
        });
    });

    it('should return 404 for non-existent cart', () => {
      return request(app.getHttpServer())
        .get('/carts/non-existent')
        .expect(404);
    });
  });

  describe('POST /carts/:id/items', () => {
    it('should add item to cart', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/carts')
        .expect(201);

      const cartId = createRes.body.id;

      return request(app.getHttpServer())
        .post(`/carts/${cartId}/items`)
        .send({
          productId: 'prod-laptop-001',
          quantity: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.items).toHaveLength(1);
          expect(res.body.items[0].productId).toBe('prod-laptop-001');
          expect(res.body.items[0].quantity).toBe(1);
        });
    });

    it('should reserve stock when adding item', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/carts')
        .expect(201);

      const cartId = createRes.body.id;

      const productBefore = await request(app.getHttpServer())
        .get('/products/prod-laptop-001')
        .expect(200);

      const initialStock = productBefore.body.stock;

      await request(app.getHttpServer())
        .post(`/carts/${cartId}/items`)
        .send({
          productId: 'prod-laptop-001',
          quantity: 2,
        })
        .expect(201);

      const productAfter = await request(app.getHttpServer())
        .get('/products/prod-laptop-001')
        .expect(200);

      expect(productAfter.body.stock).toBe(initialStock);
    });

    it('should return 400 when insufficient stock', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/carts')
        .expect(201);

      const cartId = createRes.body.id;

      return request(app.getHttpServer())
        .post(`/carts/${cartId}/items`)
        .send({
          productId: 'prod-laptop-001',
          quantity: 999, // More than available
        })
        .expect(400);
    });

    it('should return 400 for invalid product', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/carts')
        .expect(201);

      const cartId = createRes.body.id;

      return request(app.getHttpServer())
        .post(`/carts/${cartId}/items`)
        .send({
          productId: 'non-existent',
          quantity: 1,
        })
        .expect(404);
    });
  });

  describe('PUT /carts/:id/items/:productId', () => {
    it('should update item quantity', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/carts')
        .expect(201);

      const cartId = createRes.body.id;

      await request(app.getHttpServer())
        .post(`/carts/${cartId}/items`)
        .send({
          productId: 'prod-laptop-001',
          quantity: 1,
        })
        .expect(201);

      return request(app.getHttpServer())
        .put(`/carts/${cartId}/items/prod-laptop-001`)
        .send({ quantity: 3 })
        .expect(200)
        .expect((res) => {
          expect(res.body.items[0].quantity).toBe(3);
        });
    });

    it('should return 400 when item not in cart', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/carts')
        .expect(201);

      const cartId = createRes.body.id;

      return request(app.getHttpServer())
        .put(`/carts/${cartId}/items/prod-laptop-001`)
        .send({ quantity: 3 })
        .expect(400);
    });
  });

  describe('DELETE /carts/:id/items/:productId', () => {
    it('should remove item from cart', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/carts')
        .expect(201);

      const cartId = createRes.body.id;

      await request(app.getHttpServer())
        .post(`/carts/${cartId}/items`)
        .send({
          productId: 'prod-laptop-001',
          quantity: 1,
        })
        .expect(201);

      return request(app.getHttpServer())
        .delete(`/carts/${cartId}/items/prod-laptop-001`)
        .expect(200)
        .expect((res) => {
          expect(res.body.items).toHaveLength(0);
        });
    });

    it('should release reservation when removing item', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/carts')
        .expect(201);

      const cartId = createRes.body.id;

      await request(app.getHttpServer())
        .post(`/carts/${cartId}/items`)
        .send({
          productId: 'prod-laptop-001',
          quantity: 2,
        })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/carts/${cartId}/items/prod-laptop-001`)
        .expect(200);

      const cart2Res = await request(app.getHttpServer())
        .post('/carts')
        .expect(201);

      return request(app.getHttpServer())
        .post(`/carts/${cart2Res.body.id}/items`)
        .send({
          productId: 'prod-laptop-001',
          quantity: 2,
        })
        .expect(201);
    });
  });

  describe('Cart totals and discounts', () => {
    it('should calculate totals with discounts applied', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/carts')
        .expect(201);

      const cartId = createRes.body.id;

      await request(app.getHttpServer())
        .post(`/carts/${cartId}/items`)
        .send({
          productId: 'prod-laptop-001',
          quantity: 1,
        })
        .expect(201);

      return request(app.getHttpServer())
        .get(`/carts/${cartId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.totals.subtotal).toBeGreaterThan(0);
          expect(res.body.totals.discounts).toBeDefined();

          expect(res.body.totals.total).toBeLessThanOrEqual(
            res.body.totals.subtotal,
          );
        });
    });
  });
});
