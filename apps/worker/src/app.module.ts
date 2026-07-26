import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getNodeEnvironment } from '@livara/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: (environment: Record<string, unknown>) => {
        const nodeEnv =
          typeof environment.NODE_ENV === 'string'
            ? environment.NODE_ENV
            : undefined;

        return {
          ...environment,
          NODE_ENV: getNodeEnvironment(nodeEnv),
        };
      },
    }),
  ],
})
export class AppModule {}
