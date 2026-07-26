import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);

  app.enableShutdownHooks();

  console.log('Livara Worker started');
}

void bootstrap();
