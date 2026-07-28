import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  getDatabaseUrl,
  getNodeEnvironment,
  getOptionalR2Config,
  getRedisUrl,
} from '@livara/config';

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

        const resolvedNodeEnv = getNodeEnvironment(nodeEnv);

        if (resolvedNodeEnv === 'test') {
          return {
            ...environment,
            NODE_ENV: resolvedNodeEnv,
            R2_CONFIG: null,
          };
        }

        return {
          ...environment,
          NODE_ENV: resolvedNodeEnv,
          DATABASE_URL: getDatabaseUrl(environment.DATABASE_URL),
          REDIS_URL: getRedisUrl(environment.REDIS_URL),
          R2_CONFIG: getOptionalR2Config(environment),
        };
      },
    }),
  ],
})
export class AppModule {}
