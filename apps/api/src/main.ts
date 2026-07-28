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

  const port = config.get<number>('API_PORT', 3001);

  await app.listen(port);
  logger.log(`Livara API listening on port ${port}`);
}

void bootstrap();
