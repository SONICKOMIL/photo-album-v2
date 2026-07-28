import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  getDatabaseUrl,
  getNodeEnvironment,
  getOptionalR2Config,
  getPort,
  getRedisUrl,
} from '@livara/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env', '../../.env'],
      validate: (environment: Record<string, unknown>) => {
        const nodeEnv =
          typeof environment.NODE_ENV === 'string'
            ? environment.NODE_ENV
            : undefined;

        const apiPort =
          typeof environment.API_PORT === 'string'
            ? environment.API_PORT
            : undefined;

        const resolvedNodeEnv = getNodeEnvironment(nodeEnv);

        if (resolvedNodeEnv === 'test') {
          return {
            ...environment,
            NODE_ENV: resolvedNodeEnv,
            API_PORT: getPort(apiPort, 3001, 'API_PORT'),
            R2_CONFIG: null,
          };
        }

        return {
          ...environment,
          NODE_ENV: resolvedNodeEnv,
          API_PORT: getPort(apiPort, 3001, 'API_PORT'),
          DATABASE_URL: getDatabaseUrl(environment.DATABASE_URL),
          REDIS_URL: getRedisUrl(environment.REDIS_URL),
          R2_CONFIG: getOptionalR2Config(environment),
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
