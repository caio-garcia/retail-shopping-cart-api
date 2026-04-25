import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app/app.module';
import { loadSeedData } from '../src/common/data/bootstrap';
import { DiscountType } from '../src/common/interfaces/discount.interface';

describe('Discounts API (e2e)', () => {
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

  describe('GET /discounts', () => {
    it('should return all discounts', () => {
      return request(app.getHttpServer())
        .get('/discounts')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[0]).toHaveProperty('type');
        });
    });

    it('should filter active discounts only', () => {
      return request(app.getHttpServer())
        .get('/discounts?activeOnly=true')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.every((d) => d.isActive === true)).toBe(true);
        });
    });
  });

  describe('GET /discounts/:id', () => {
    it('should return a specific discount', () => {
      return request(app.getHttpServer())
        .get('/discounts/650e8400-e29b-41d4-a716-446655440001')
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe('650e8400-e29b-41d4-a716-446655440001');
          expect(res.body.name).toBeDefined();
        });
    });

    it('should return 404 for non-existent discount', () => {
      return request(app.getHttpServer())
        .get('/discounts/non-existent')
        .expect(404);
    });
  });

  describe('POST /discounts', () => {
    it('should create a new percentage discount', () => {
      const newDiscount = {
        name: 'Test 15% Off',
        description: 'E2E test discount',
        type: DiscountType.PERCENTAGE_OFF,
        isActive: true,
        rules: {
          percentage: 15,
        },
      };

      return request(app.getHttpServer())
        .post('/discounts')
        .send(newDiscount)
        .expect(201)
        .expect((res) => {
          expect(res.body.id).toBeDefined();
          expect(res.body.name).toBe(newDiscount.name);
          expect(res.body.rules.percentage).toBe(15);
        });
    });

    it('should create a new BOGO discount', () => {
      const newDiscount = {
        name: 'Test BOGO',
        description: 'Buy 1 get 1 free',
        type: DiscountType.BUY_X_GET_Y,
        isActive: true,
        rules: {
          buyQuantity: 1,
          getQuantity: 1,
          productId: '550e8400-e29b-41d4-a716-446655440002',
        },
      };

      return request(app.getHttpServer())
        .post('/discounts')
        .send(newDiscount)
        .expect(201)
        .expect((res) => {
          expect(res.body.rules.buyQuantity).toBe(1);
          expect(res.body.rules.getQuantity).toBe(1);
        });
    });

    it('should return 400 for invalid discount data', () => {
      const invalidDiscount = {
        name: '',
        type: 'INVALID_TYPE',
      };

      return request(app.getHttpServer())
        .post('/discounts')
        .send(invalidDiscount)
        .expect(400);
    });
  });

  describe('PUT /discounts/:id', () => {
    it('should update an existing discount', () => {
      const updates = {
        name: 'Updated Discount Name',
        isActive: false,
      };

      return request(app.getHttpServer())
        .put('/discounts/650e8400-e29b-41d4-a716-446655440001')
        .send(updates)
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe(updates.name);
          expect(res.body.isActive).toBe(false);
        });
    });

    it('should return 404 for non-existent discount', () => {
      return request(app.getHttpServer())
        .put('/discounts/non-existent')
        .send({ name: 'Test' })
        .expect(404);
    });
  });
});
