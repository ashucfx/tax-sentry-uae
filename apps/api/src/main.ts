import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: false,
      bodyLimit: 1_048_576, // 1 MB — prevents DoS via oversized payloads
    }),
    { bufferLogs: true },
  );

  const configService = app.get(ConfigService);
  // Railway/Render inject PORT — prefer it over API_PORT so the platform proxy can reach the app
  const port = configService.get<number>('PORT') ?? configService.get<number>('API_PORT', 3001);
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');

  // Security
  await app.register(require('@fastify/helmet'), {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  });
  await app.register(require('@fastify/compress'));
  await app.register(require('@fastify/cookie'));

  app.enableCors({
    origin: configService.get<string>('WEB_URL', 'http://localhost:3000'),
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors — AuditInterceptor uses DI (requires PrismaService)
  const auditInterceptor = app.get(AuditInterceptor);
  app.useGlobalInterceptors(new TransformInterceptor(), auditInterceptor);

  // Swagger (only in local development — never in staging or production)
  if (!['production', 'staging'].includes(nodeEnv)) {
    const config = new DocumentBuilder()
      .setTitle('QFZP Status Protection API')
      .setDescription('UAE Free Zone Corporate Tax Compliance Platform')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication')
      .addTag('organizations', 'Organization management')
      .addTag('revenue', 'Revenue transactions')
      .addTag('classification', 'Revenue classification engine')
      .addTag('deminimis', 'De-minimis threshold tracking')
      .addTag('risk', 'Risk scoring engine')
      .addTag('alerts', 'Alert management')
      .addTag('substance', 'Substance document vault')
      .addTag('reports', 'Compliance reports export')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
    logger.log(`Swagger docs: http://localhost:${port}/api/docs`);
  }

  // Init first so NestJS registers its content-type parsers, then override the JSON
  // parser to also stash req.rawBody for Dodo/Svix webhook HMAC-SHA256 verification.
  await app.init();

  const fastify = app.getHttpAdapter().getInstance();
  fastify.removeContentTypeParser('application/json');
  fastify.addContentTypeParser(
    'application/json',
    { parseAs: 'buffer' },
    (req: any, body: Buffer, done: (err: Error | null, body?: unknown) => void) => {
      req.rawBody = body;
      try {
        done(null, JSON.parse(body.toString('utf8')));
      } catch (e: any) {
        e.statusCode = 400;
        done(e);
      }
    },
  );

  await app.listen(port, '0.0.0.0');
  logger.log(`QFZP API running on port ${port} [${nodeEnv}]`);
}

bootstrap();
