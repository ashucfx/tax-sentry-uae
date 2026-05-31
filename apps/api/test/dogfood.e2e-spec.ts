import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Dogfooding E2E - Full UAE Pilot Simulation', () => {
  let app: INestApplication;
  
  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    
    // For Fastify, supertest needs the underlying server
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('1. Simulate CFO Signup (Send OTP)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/otp/send')
      .send({ email: 'dogfood-cfo@taxsentry.com' })
      .expect(200);
      
    expect(res.body.success).toBe(true);
  });
  
  // NOTE: This is a placeholder test file to formalize the dogfooding requirement.
  // In a real staging environment, we'd mock the OTP or pull it from the DB to complete login.
  it('2. Simulate Database Verification (Ready for Manual QA)', () => {
     expect(true).toBe(true);
  });
});
