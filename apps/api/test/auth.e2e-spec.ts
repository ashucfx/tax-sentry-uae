import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';

describe('Auth Validation (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    );
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/send-otp (POST)', () => {
    it('should reject invalid email format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({ email: 'invalid-email' })
        .expect(400)
        .expect((res: any) => {
          expect(res.body.message).toContain('email must be an email');
        });
    });

    it('should reject missing email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/send-otp')
        .send({})
        .expect(400);
    });
  });

  describe('/auth/verify-otp (POST)', () => {
    it('should reject missing OTP code', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({ email: 'test@example.com' })
        .expect(400);
    });

    it('should fail with invalid OTP code', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/verify-otp')
        .send({ email: 'test@example.com', code: '000000' })
        .expect(401);
    });
  });

  describe('Protected Routes', () => {
    it('should prevent access without JWT', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);
    });
    
    it('should prevent access with malformed JWT', () => {
      return request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalid.token.here')
        .expect(401);
    });
  });
});
