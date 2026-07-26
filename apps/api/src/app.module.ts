import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { getNodeEnvironment, getPort } from '@livara/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

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

        const apiPort =
          typeof environment.API_PORT === 'string'
            ? environment.API_PORT
            : undefined;

        return {
          ...environment,
          NODE_ENV: getNodeEnvironment(nodeEnv),
          API_PORT: getPort(apiPort, 3001, 'API_PORT'),
        };
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
