// apps/api/src/main.ts
import path from 'path';

import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './core/filters/http-exception.filter';

import { PrismaService } from './prisma/prisma.service';
import { FileStorageService } from './shared/services/file-storage.service';
import { appRouter } from './trpc/app.router';
import { router as createTrpcRouter } from './trpc/trpc';
import { AI_TRPC_ROUTERS } from './modules/ai/module';
import {
  createContext,
  setPrismaService,
  setFileStorageService,
  setAppInstance,
} from './trpc/trpc';
import * as trpcExpress from '@trpc/server/adapters/express';
import { ValidationPipe } from '@nestjs/common';
import express from 'express';
import { json } from 'express';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const port = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  // Security headers (Helmet)
  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'https:'],
              connectSrc: ["'self'"],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // CORS with production validation
  const corsOrigin = process.env.CORS_ORIGIN || '*';
  if (isProduction && corsOrigin === '*') {
    console.warn('CORS_ORIGIN is "*" in production. This is insecure.');
  }
  app.enableCors({
    origin: corsOrigin === '*' ? true : corsOrigin.split(','),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  });

  // Body size limit + raw body capture for WeChat payment callbacks
  app.use(
    json({
      limit: '10mb',
      verify: (req: any, _res, buf) => {
        if (
          req.url?.includes('/payments/wechat/callback') ||
          req.url?.includes('/payments/wechat/refund-callback') ||
          req.url?.includes('/wecom/callback')
        ) {
          req.rawBody = buf.toString();
        }
      },
    }),
  );

  // 配置静态文件服务（用于访问上传的文件）
  const uploadPath = process.env.UPLOAD_PATH || path.resolve(__dirname, '../../../uploads');
  app.use(express.static(uploadPath));

  // Set global prefix for all REST API routes
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Set up tRPC middleware
  const prismaService = app.get(PrismaService);
  setPrismaService(prismaService.extended || prismaService);

  const fileStorageService = app.get(FileStorageService);
  setFileStorageService(fileStorageService);

  setAppInstance(app);

  // AI 三层 router 运行时组装（依赖 ToolRegistry/AgentYamlLoader 等 Nest 实例）
  const aiRouters = app.get<any>(AI_TRPC_ROUTERS);
  const mergedAppRouter = createTrpcRouter({
    ...appRouter._def.procedures,
    ...aiRouters,
  });

  (app as any).use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
      router: mergedAppRouter,
      createContext: (opts) => createContext(opts),
    }),
  );

  await app.listen(port);
  console.log(`Backend started: http://localhost:${port}/trpc`);
  console.log(`REST API: http://localhost:${port}/api`);
}
bootstrap();
