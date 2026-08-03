import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { R2Config } from '@livara/config';
import { verifyBackendInfrastructure } from '@livara/shared';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  try {
    const result = await verifyBackendInfrastructure({
      databaseUrl: config.getOrThrow<string>('DATABASE_URL'),
      redisUrl: config.getOrThrow<string>('REDIS_URL'),
      r2: config.get<R2Config | null>('R2_CONFIG') ?? null,
    });

    logger.log(`PostgreSQL connectivity: ${result.postgres}`);
    logger.log(`Redis connectivity: ${result.redis}`);

    if (result.r2 === 'skipped') {
      logger.warn(
        'R2 connectivity: skipped (credentials not configured). Local development can continue without R2.',
      );
    } else {
      logger.log(`R2 connectivity: ${result.r2}`);
    }
  } catch (error) {
    // PostgreSQL/Redis belong to later roadmap phases (Prisma, BullMQ).
    // In production their absence is fatal; in development the API keeps
    // running so the temporary Manual MVP (docs/MVP_MANUAL_OPERATIONS.md),
    // which does not depend on them, remains operable.
    if (config.get<string>('NODE_ENV') === 'production') {
      throw error;
    }

    const detail = error instanceof Error ? error.message : String(error);
    logger.warn(
      `Infrastructure verification failed: ${detail}. ` +
        'Continuing in development mode; PostgreSQL/Redis-dependent phases are unavailable until infrastructure is running.',
    );
  }

  const webOrigin = config.get<string>(
    'MVP_PUBLIC_WEB_URL',
    'http://localhost:3000',
  );

  app.enableCors({
    origin: [webOrigin],
    methods: ['GET', 'POST', 'DELETE'],
  });

  const port = config.get<number>('API_PORT', 3001);

  await app.listen(port);
  logger.log(`Livara API listening on port ${port}`);
}

void bootstrap();
