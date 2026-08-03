import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MvpService } from './mvp.service';
import { OperatorKeyGuard } from './operator-key.guard';

type CreateAlbumBody = {
  title?: unknown;
  uploadExpiresAt?: unknown;
};

type OpenUploadsBody = {
  uploadExpiresAt?: unknown;
};

/**
 * TEMPORARY INTERNAL OPERATOR ENDPOINTS — Manual MVP only.
 *
 * Driven by the local operator CLI (scripts/mvp) and protected by
 * OperatorKeyGuard (shared secret from MVP_OPERATOR_KEY; disabled when the
 * key is not configured). This is not a production admin API: it is replaced
 * by authenticated Super Admin / Organizer functionality in Roadmap
 * Phases 5–8.
 */
@Controller('api/v1/mvp/operator/albums')
@UseGuards(OperatorKeyGuard)
export class MvpOperatorController {
  constructor(private readonly mvpService: MvpService) {}

  @Post()
  async createAlbum(
    @Body() body: CreateAlbumBody,
  ): Promise<{ success: true; data: unknown }> {
    const album = await this.mvpService.createAlbum(
      body?.title,
      body?.uploadExpiresAt,
    );
    return { success: true, data: album };
  }

  @Get()
  async listAlbums(): Promise<{ success: true; data: unknown }> {
    const albums = await this.mvpService.listAlbums();
    return { success: true, data: albums };
  }

  @Get(':albumId')
  async getAlbum(
    @Param('albumId') albumId: string,
  ): Promise<{ success: true; data: unknown }> {
    const album = await this.mvpService.getAlbumForOperator(albumId);
    return { success: true, data: album };
  }

  @Get(':albumId/media')
  async listMedia(
    @Param('albumId') albumId: string,
  ): Promise<{ success: true; data: unknown }> {
    const media = await this.mvpService.listMedia(albumId);
    return { success: true, data: media };
  }

  @Delete(':albumId/media/:mediaId')
  async deleteMedia(
    @Param('albumId') albumId: string,
    @Param('mediaId') mediaId: string,
  ): Promise<{ success: true; data: { deleted: true } }> {
    await this.mvpService.deleteMedia(albumId, mediaId);
    return { success: true, data: { deleted: true } };
  }

  @Post(':albumId/uploads/open')
  async openUploads(
    @Param('albumId') albumId: string,
    @Body() body: OpenUploadsBody,
  ): Promise<{ success: true; data: unknown }> {
    const album = await this.mvpService.setUploadsEnabled(
      albumId,
      true,
      body?.uploadExpiresAt,
    );
    return { success: true, data: album };
  }

  @Post(':albumId/uploads/close')
  async closeUploads(
    @Param('albumId') albumId: string,
  ): Promise<{ success: true; data: unknown }> {
    const album = await this.mvpService.setUploadsEnabled(albumId, false);
    return { success: true, data: album };
  }
}
