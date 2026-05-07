import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';

const server = express();
let bootstrapped = false;

async function bootstrap(): Promise<void> {
  if (bootstrapped) return;

  // Webhook route gets raw Buffer body BEFORE json() middleware
  // so Svix HMAC verification has access to req.rawBody
  server.use(
    '/api/v1/billing/webhook',
    express.raw({ type: 'application/json' }),
    (req: any, _res: any, next: any) => {
      req.rawBody = req.body as Buffer;
      try { req.body = JSON.parse((req.rawBody as Buffer).toString('utf8')); } catch (_) { /* leave as Buffer */ }
      next();
    },
  );
  server.use(express.json({ limit: '1mb' }));
  server.use(express.urlencoded({ extended: false }));
  server.use(cookieParser());

  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['log', 'error', 'warn'],
  });

  app.setGlobalPrefix('api/v1');

  // Accept comma-separated origins so you can list both the Vercel preview URL
  // and production domain in a single WEB_URL env var.
  const allowedOrigins = (process.env.WEB_URL ?? 'http://localhost:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins.length === 1 ? allowedOrigins[0] : allowedOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const auditInterceptor = app.get(AuditInterceptor);
  app.useGlobalInterceptors(new TransformInterceptor(), auditInterceptor);

  await app.init();
  bootstrapped = true;
}

export default async function handler(req: express.Request, res: express.Response): Promise<void> {
  await bootstrap();
  server(req, res);
}
