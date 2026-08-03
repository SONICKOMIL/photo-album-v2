import {
  Controller,
  Get,
  Param,
  Post,
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { memoryStorage } from 'multer';
import { MvpService, type MvpUploadFile } from './mvp.service';
import {
  MVP_MAX_FILES_PER_REQUEST,
  MVP_MAX_FILE_SIZE_BYTES,
} from './mvp.validation';
import { UploadRateLimitGuard } from './upload-rate-limit.guard';

/**
 * Public guest endpoints of the temporary Manual MVP.
 *
 * Routes live under /api/v1/mvp so they cannot be confused with the
 * documented long-term API contract (docs/API.md) implemented in later
 * roadmap phases.
 */
@Controller('api/v1/mvp/guest/albums')
export class MvpGuestController {
  constructor(private readonly mvpService: MvpService) {}

  @Get(':guestToken')
  async getAlbum(@Param('guestToken') guestToken: string): Promise<{
    success: true;
    data: {
      title: string;
      uploadOpen: boolean;
      uploadExpiresAt: string | null;
    };
  }> {
    const data = await this.mvpService.getGuestAlbum(guestToken);
    return { success: true, data };
  }

  /**
   * Guest gallery metadata. Requires a valid guest token; does not expose
   * storage keys, filesystem paths, or operator fields. Image bytes are
   * fetched separately through the controlled media file route.
   */
  @Get(':guestToken/media')
  async listMedia(@Param('guestToken') guestToken: string): Promise<{
    success: true;
    data: { items: Array<{ id: string; url: string; createdAt: string }> };
  }> {
    const items = await this.mvpService.listGuestMedia(guestToken);
    return { success: true, data: { items } };
  }

  @Post(':guestToken/uploads')
  @UseGuards(UploadRateLimitGuard)
  @UseInterceptors(
    FilesInterceptor('files', MVP_MAX_FILES_PER_REQUEST, {
      storage: memoryStorage(),
      limits: {
        fileSize: MVP_MAX_FILE_SIZE_BYTES,
        files: MVP_MAX_FILES_PER_REQUEST,
      },
    }),
  )
  async uploadFiles(
    @Param('guestToken') guestToken: string,
    @UploadedFiles() files: MvpUploadFile[] | undefined,
  ): Promise<{ success: true; data: unknown }> {
    const data = await this.mvpService.uploadGuestMedia(
      guestToken,
      files ?? [],
    );
    return { success: true, data };
  }

  /**
   * Controlled media delivery: album access is proven by the guest token
   * before any bytes are returned. There is no directory listing and no
   * filesystem path or storage key in the response.
   */
  @Get(':guestToken/media/:mediaId/file')
  async getMediaFile(
    @Param('guestToken') guestToken: string,
    @Param('mediaId') mediaId: string,
    @Res() response: Response,
  ): Promise<void> {
    const { media, object } = await this.mvpService.getGuestMediaFile(
      guestToken,
      mediaId,
    );

    response.setHeader('Content-Type', object.contentType ?? media.mimeType);
    if (object.size !== undefined) {
      response.setHeader('Content-Length', object.size);
    }
    response.setHeader('Cache-Control', 'private, max-age=60');
    response.setHeader('X-Content-Type-Options', 'nosniff');

    object.body.pipe(response);
  }
}
