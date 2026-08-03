import * as path from 'node:path';
import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { R2Config } from '@livara/config';
import { resolveMvpConfig, type MvpConfig } from './mvp.config';
import { MvpGuestController } from './mvp-guest.controller';
import { MvpOperatorController } from './mvp-operator.controller';
import { MvpService } from './mvp.service';
import {
  MVP_CONFIG,
  MVP_STORAGE,
  MVP_STORE,
  type MvpStorageAdapter,
  type MvpStore,
} from './mvp.types';
import { LocalFsStorageAdapter } from './storage/local-fs.storage';
import { R2StorageAdapter } from './storage/r2.storage';
import { MvpJsonStore } from './store/mvp-json.store';

/**
 * TEMPORARY MANUAL MVP MODULE — see docs/MVP_MANUAL_OPERATIONS.md.
 *
 * Everything in apps/api/src/mvp is a self-contained vertical slice that
 * allows Livara to be operated manually today. It is replaced piece by piece
 * by the documented roadmap phases (Prisma, auth, upload windows, direct R2
 * upload) without requiring a rewrite of the rest of the application.
 */
@Module({
  controllers: [MvpGuestController, MvpOperatorController],
  providers: [
    {
      provide: MVP_CONFIG,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): MvpConfig =>
        resolveMvpConfig({
          MVP_DATA_DIR: configService.get<string>('MVP_DATA_DIR'),
          MVP_UPLOAD_DIR: configService.get<string>('MVP_UPLOAD_DIR'),
          MVP_OPERATOR_KEY: configService.get<string>('MVP_OPERATOR_KEY'),
          MVP_PUBLIC_WEB_URL: configService.get<string>('MVP_PUBLIC_WEB_URL'),
        }),
    },
    {
      provide: MVP_STORE,
      inject: [MVP_CONFIG],
      useFactory: (config: MvpConfig): MvpStore =>
        new MvpJsonStore(path.join(config.dataDir, 'mvp-store.json')),
    },
    {
      provide: MVP_STORAGE,
      inject: [MVP_CONFIG, ConfigService],
      useFactory: (
        config: MvpConfig,
        configService: ConfigService,
      ): MvpStorageAdapter => {
        const logger = new Logger('MvpModule');
        const r2Config = configService.get<R2Config | null>('R2_CONFIG');

        if (r2Config != null) {
          logger.log('MVP storage: Cloudflare R2 (private bucket).');
          return new R2StorageAdapter(r2Config);
        }

        logger.warn(
          'MVP storage: local filesystem fallback (R2 credentials not configured). ' +
            'Uploads are stored in the gitignored MVP upload directory.',
        );
        return new LocalFsStorageAdapter(config.uploadDir);
      },
    },
    MvpService,
  ],
})
export class MvpModule {}
