import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { loadSeedData } from '../src/common/data/bootstrap';
import { cartsStore } from '../src/carts/carts.store';
import { reservationsStore } from '../src/inventory/inventory.store';

describe('Checkout Scenarios (e2e)', () => {
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

  describe('POST /carts/:id/checkout', () => {
    it('should successfully checkout cart and update stock', async () => {
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

      const checkoutRes = await request(app.getHttpServer())
        .post(`/carts/${cartId}/checkout`)
        .expect(201);

      expect(checkoutRes.body.cartId).toBe(cartId);
      expect(checkoutRes.body.items).toHaveLength(1);
      expect(checkoutRes.body.subtotal).toBeGreaterThan(0);
      expect(checkoutRes.body.total).toBeDefined();
      expect(checkoutRes.body.completedAt).toBeDefined();

      const productAfter = await request(app.getHttpServer())
        .get('/products/prod-laptop-001')
        .expect(200);

      expect(productAfter.body.stock).toBe(initialStock - 2);
    });

    it('should apply discounts during checkout', async () => {
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

      const checkoutRes = await request(app.getHttpServer())
        .post(`/carts/${cartId}/checkout`)
        .expect(201);

      expect(checkoutRes.body.discounts).toBeDefined();
      expect(checkoutRes.body.discounts.length).toBeGreaterThan(0);
      expect(checkoutRes.body.total).toBeLessThan(checkoutRes.body.subtotal);
    });

    it('should fail checkout when cart is empty', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/carts')
        .expect(201);

      const cartId = createRes.body.id;

      return request(app.getHttpServer())
        .post(`/carts/${cartId}/checkout`)
        .expect(400);
    });

    it('should fail checkout when stock becomes insufficient', async () => {
      const cart1Res = await request(app.getHttpServer())
        .post('/carts')
        .expect(201);

      await request(app.getHttpServer())
        .post(`/carts/${cart1Res.body.id}/items`)
        .send({
          productId: 'prod-monitor-001',
          quantity: 5,
        })
        .expect(201);

      const cart2Res = await request(app.getHttpServer())
        .post('/carts')
        .expect(201);

      return request(app.getHttpServer())
        .post(`/carts/${cart2Res.body.id}/items`)
        .send({
          productId: 'prod-monitor-001',
          quantity: 5,
        })
        .expect(400);
    });

    it('should not allow checkout of already completed cart', async () => {
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

      await request(app.getHttpServer())
        .post(`/carts/${cartId}/checkout`)
        .expect(201);

      return request(app.getHttpServer())
        .post(`/carts/${cartId}/checkout`)
        .expect(400);
    });

    it('should handle BOGO discount correctly', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/carts')
        .expect(201);

      const cartId = createRes.body.id;

      await request(app.getHttpServer())
        .post(`/carts/${cartId}/items`)
        .send({
          productId: 'prod-mouse-001',
          quantity: 3,
        })
        .expect(201);

      const checkoutRes = await request(app.getHttpServer())
        .post(`/carts/${cartId}/checkout`)
        .expect(201);

      const bogoDiscount = checkoutRes.body.discounts.find((d) =>
        d.discountName.toLowerCase().includes('buy 2 get 1'),
      );

      expect(bogoDiscount).toBeDefined();
      if (bogoDiscount) {
        expect(bogoDiscount.amount).toBeGreaterThan(0);
      }
    });

    it('should handle bulk discount correctly', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/carts')
        .expect(201);

      const cartId = createRes.body.id;

      await request(app.getHttpServer())
        .post(`/carts/${cartId}/items`)
        .send({
          productId: 'prod-cable-001',
          quantity: 6,
        })
        .expect(201);

      const checkoutRes = await request(app.getHttpServer())
        .post(`/carts/${cartId}/checkout`)
        .expect(201);

      const bulkDiscount = checkoutRes.body.discounts.find((d) =>
        d.discountName.toLowerCase().includes('bulk'),
      );

      expect(bulkDiscount).toBeDefined();
      if (bulkDiscount) {
        expect(bulkDiscount.amount).toBeGreaterThan(0);
      }
    });
  });

  describe('Concurrency scenarios', () => {
    it('should handle concurrent carts competing for limited stock', async () => {
      const productId = 'prod-monitor-001';

      const cart1Res = await request(app.getHttpServer())
        .post('/carts')
        .expect(201);

      const cart2Res = await request(app.getHttpServer())
        .post('/carts')
        .expect(201);

      await request(app.getHttpServer())
        .post(`/carts/${cart1Res.body.id}/items`)
        .send({
          productId,
          quantity: 5,
        })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/carts/${cart2Res.body.id}/items`)
        .send({
          productId,
          quantity: 3,
        })
        .expect(201);

      const cart3Res = await request(app.getHttpServer())
        .post('/carts')
        .expect(201);

      return request(app.getHttpServer())
        .post(`/carts/${cart3Res.body.id}/items`)
        .send({
          productId,
          quantity: 1,
        })
        .expect(400);
    });

    it('should allow multiple carts to operate independently', async () => {
      const cart1 = await request(app.getHttpServer())
        .post('/carts')
        .then((res) => res.body);

      const cart2 = await request(app.getHttpServer())
        .post('/carts')
        .then((res) => res.body);

      const cart3 = await request(app.getHttpServer())
        .post('/carts')
        .then((res) => res.body);

      await request(app.getHttpServer())
        .post(`/carts/${cart1.id}/items`)
        .send({ productId: 'prod-laptop-001', quantity: 1 })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/carts/${cart2.id}/items`)
        .send({ productId: 'prod-mouse-001', quantity: 2 })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/carts/${cart3.id}/items`)
        .send({ productId: 'prod-keyboard-001', quantity: 1 })
        .expect(201);

      const [res1, res2, res3] = await Promise.all([
        request(app.getHttpServer()).get(`/carts/${cart1.id}`),
        request(app.getHttpServer()).get(`/carts/${cart2.id}`),
        request(app.getHttpServer()).get(`/carts/${cart3.id}`),
      ]);

      expect(res1.body.items[0].productId).toBe('prod-laptop-001');
      expect(res2.body.items[0].productId).toBe('prod-mouse-001');
      expect(res3.body.items[0].productId).toBe('prod-keyboard-001');
    });
  });
});
