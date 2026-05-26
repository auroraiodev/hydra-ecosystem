import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/database/prisma.service';

describe('Auth API (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

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
  });

  describe('/api/v1/auth/register (POST)', () => {
    it('should register a new user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: expect.objectContaining({
            email: testUser.email,
            username: testUser.username,
            first_name: testUser.first_name,
            last_name: testUser.last_name,
          }),
          tokens: expect.objectContaining({
            access_token: expect.any(String),
            refresh_token: expect.any(String),
          }),
        },
        meta: expect.objectContaining({
          version: 'v1.0.0',
          timestamp: expect.any(String),
          requestId: expect.any(String),
        }),
      });
    });

    it('should return validation error for duplicate email', async () => {
      // Create first user
      await request(app.getHttpServer()).post('/api/v1/auth/register').send(testUser);

      // Try to create second user with same email
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser)
        .expect(409);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'CONFLICT',
          message: expect.any(String),
        },
        meta: expect.objectContaining({
          version: 'v1.0.0',
          timestamp: expect.any(String),
          requestId: expect.any(String),
        }),
      });
    });

    it('should return validation error for invalid data', async () => {
      const invalidUser = { ...testUser, email: 'invalid-email' };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(invalidUser)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.any(String),
          message: expect.any(String),
        },
      });
    });
  });

  describe('/api/v1/auth/login (POST)', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await request(app.getHttpServer()).post('/api/v1/auth/register').send(testUser);
    });

    it('should login user successfully', async () => {
      const loginData = {
        email: testUser.email,
        password: testUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: expect.objectContaining({
            email: testUser.email,
          }),
          tokens: expect.objectContaining({
            access_token: expect.any(String),
            refresh_token: expect.any(String),
          }),
        },
        meta: expect.objectContaining({
          version: 'v1.0.0',
          timestamp: expect.any(String),
          requestId: expect.any(String),
        }),
      });
    });

    it('should return unauthorized error for invalid credentials', async () => {
      const invalidLogin = {
        email: testUser.email,
        password: 'wrongpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(invalidLogin)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: expect.any(String),
        },
      });
    });

    it('should return not found error for non-existent user', async () => {
      const nonExistentLogin = {
        email: 'nonexistent@example.com',
        password: testUser.password,
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send(nonExistentLogin)
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

  describe('/api/v1/auth/refresh (POST)', () => {
    let refreshToken: string;

    beforeEach(async () => {
      // Register and login to get tokens
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser);

      refreshToken = registerResponse.body.data.tokens.refresh_token;
    });

    it('should refresh tokens successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          access_token: expect.any(String),
          refresh_token: expect.any(String),
        }),
        meta: expect.objectContaining({
          version: 'v1.0.0',
          timestamp: expect.any(String),
          requestId: expect.any(String),
        }),
      });
    });

    it('should return unauthorized error for invalid refresh token', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({ refresh_token: 'invalid-token' })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: expect.any(String),
        },
      });
    });
  });

  describe('/api/v1/auth/validate (GET)', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get access token
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser);

      accessToken = registerResponse.body.data.tokens.access_token;
    });

    it('should validate token successfully', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/validate')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          valid: true,
          user: expect.objectContaining({
            email: testUser.email,
          }),
        },
        meta: expect.objectContaining({
          version: 'v1.0.0',
          timestamp: expect.any(String),
          requestId: expect.any(String),
        }),
      });
    });

    it('should return unauthorized error for invalid token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/auth/validate')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: expect.any(String),
        },
      });
    });

    it('should return unauthorized error for missing token', async () => {
      const response = await request(app.getHttpServer()).get('/api/v1/auth/validate').expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: expect.any(String),
        },
      });
    });
  });

  describe('/api/v1/auth/logout (POST)', () => {
    let accessToken: string;

    beforeEach(async () => {
      // Register and login to get access token
      const registerResponse = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(testUser);

      accessToken = registerResponse.body.data.tokens.access_token;
    });

    it('should logout user successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          message: 'Logout successful',
        },
        meta: expect.objectContaining({
          version: 'v1.0.0',
          timestamp: expect.any(String),
          requestId: expect.any(String),
        }),
      });
    });
  });
});
