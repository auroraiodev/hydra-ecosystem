import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';

describe('Users API (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let accessToken: string;

  const testUser = {
    email: 'test@example.com',
    username: 'testuser',
    first_name: 'Test',
    last_name: 'User',
    password: 'password123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);

    await app.init();
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.users.deleteMany({
      where: { email: { contains: 'test' } },
    });
    await app.close();
  });

  beforeEach(async () => {
    // Clean up before each test
    await prismaService.users.deleteMany({
      where: { email: { contains: 'test' } },
    });

    // Create test user and get token
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send(testUser);

    accessToken = registerResponse.body.data.tokens.access_token;
  });

  describe('/api/v1/users (GET)', () => {
    it('should get users list successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          items: expect.any(Array),
          pagination: expect.objectContaining({
            page: expect.any(Number),
            limit: expect.any(Number),
            total: expect.any(Number),
            totalPages: expect.any(Number),
          }),
        },
        meta: expect.objectContaining({
          version: 'v1.0.0',
          timestamp: expect.any(String),
          requestId: expect.any(String),
        }),
      });
    });

    it('should return unauthorized error without token', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/users').expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: expect.any(String),
        },
      });
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users?page=1&limit=5')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.pagination).toMatchObject({
        page: 1,
        limit: 5,
      });
    });

    it('should support search', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users?search=test')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          items: expect.any(Array),
        },
      });
    });
  });

  describe('/api/v1/users/:id (GET)', () => {
    let userId: string;

    beforeEach(async () => {
      // Get user ID from the current user
      const userResponse = await request(app.getHttpServer())
        .get('/api/v1/auth/validate')
        .set('Authorization', `Bearer ${accessToken}`);

      userId = userResponse.body.data.user.id;
    });

    it('should get user by id successfully', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: userId,
          email: testUser.email,
          username: testUser.username,
        }),
        meta: expect.objectContaining({
          version: 'v1.0.0',
          timestamp: expect.any(String),
          requestId: expect.any(String),
        }),
      });
    });

    it('should return not found error for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/users/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: expect.any(String),
        },
      });
    });
  });

  describe('/api/v1/users (PUT)', () => {
    let userId: string;

    beforeEach(async () => {
      // Get user ID from the current user
      const userResponse = await request(app.getHttpServer())
        .get('/api/v1/auth/validate')
        .set('Authorization', `Bearer ${accessToken}`);

      userId = userResponse.body.data.user.id;
    });

    it('should update user successfully', async () => {
      const updateData = {
        first_name: 'Updated',
        last_name: 'Name',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: userId,
          first_name: 'Updated',
          last_name: 'Name',
        }),
        meta: expect.objectContaining({
          version: 'v1.0.0',
          timestamp: expect.any(String),
          requestId: expect.any(String),
        }),
      });
    });

    it('should return validation error for invalid data', async () => {
      const invalidData = {
        email: 'invalid-email',
      };

      const response = await request(app.getHttpServer())
        .put(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.any(String),
          message: expect.any(String),
        },
      });
    });

    it('should return not found error for non-existent user', async () => {
      const updateData = {
        first_name: 'Updated',
      };

      const response = await request(app.getHttpServer())
        .put('/api/v1/users/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: expect.any(String),
        },
      });
    });
  });

  describe('/api/v1/users/:id (DELETE)', () => {
    let userId: string;

    beforeEach(async () => {
      // Get user ID from the current user
      const userResponse = await request(app.getHttpServer())
        .get('/api/v1/auth/validate')
        .set('Authorization', `Bearer ${accessToken}`);

      userId = userResponse.body.data.user.id;
    });

    it('should delete user successfully', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/users/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          id: userId,
        }),
        meta: expect.objectContaining({
          version: 'v1.0.0',
          timestamp: expect.any(String),
          requestId: expect.any(String),
        }),
      });
    });

    it('should return not found error for non-existent user', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/v1/users/nonexistent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: expect.any(String),
        },
      });
    });
  });

  describe('API Versioning', () => {
    it('should support version via header', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Api-Version', '1.0.0')
        .expect(200);

      expect(response.body.meta.version).toBe('v1.0.0');
    });

    it('should support version via query parameter', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users?v=1.0.0')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.meta.version).toBe('v1.0.0');
    });

    it('should return error for unsupported version', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('Api-Version', '2.0.0')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNSUPPORTED_API_VERSION',
          message: expect.any(String),
        },
      });
    });
  });
});
