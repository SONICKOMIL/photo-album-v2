import { randomBytes, randomUUID } from 'node:crypto';
import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { buildGuestUrl, type MvpConfig } from './mvp.config';
import {
  albumNotFound,
  mediaNotFound,
  uploadsClosed,
  uploadsExpired,
  validationError,
} from './mvp.errors';
import {
  MVP_ALLOWED_IMAGE_MIME_TYPES,
  MVP_EXTENSION_BY_MIME,
  MVP_MAX_FILES_PER_REQUEST,
  MVP_MAX_FILE_SIZE_BYTES,
  MVP_MAX_TITLE_LENGTH,
  detectImageMimeType,
  sanitizeOriginalFilename,
} from './mvp.validation';
import {
  MVP_CONFIG,
  MVP_STORAGE,
  MVP_STORE,
  type MvpAlbumRecord,
  type MvpMediaRecord,
  type MvpStorageAdapter,
  type MvpStore,
  type MvpStoredObject,
} from './mvp.types';

export type MvpUploadFile = {
  originalname?: string;
  mimetype?: string;
  size: number;
  buffer: Buffer;
};

export type MvpUploadResult = {
  accepted: Array<{
    mediaId: string;
    originalFilename: string;
    mimeType: string;
    size: number;
  }>;
  rejected: Array<{
    originalFilename: string;
    code: string;
    message: string;
  }>;
};

export type MvpAlbumWithGuestUrl = MvpAlbumRecord & { guestUrl: string };

/** Safe guest-facing media metadata — no storage keys or filesystem paths. */
export type MvpGuestMediaItem = {
  id: string;
  /** Controlled API path; requires the guest token to fetch bytes. */
  url: string;
  createdAt: string;
};

export type MvpUploadAvailability =
  | { allowed: true }
  | { allowed: false; reason: 'UPLOADS_CLOSED' | 'UPLOADS_EXPIRED' };

@Injectable()
export class MvpService implements OnModuleInit {
  constructor(
    @Inject(MVP_STORE) private readonly store: MvpStore,
    @Inject(MVP_STORAGE) private readonly storage: MvpStorageAdapter,
    @Inject(MVP_CONFIG) private readonly config: MvpConfig,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.store.init();
  }

  get storageKind(): string {
    return this.storage.kind;
  }

  // ---------------------------------------------------------------
  // Operator operations
  // ---------------------------------------------------------------

  async createAlbum(
    title: unknown,
    uploadExpiresAt?: unknown,
  ): Promise<MvpAlbumWithGuestUrl> {
    if (typeof title !== 'string' || title.trim() === '') {
      throw validationError('Album title is required.');
    }
    if (title.trim().length > MVP_MAX_TITLE_LENGTH) {
      throw validationError(
        `Album title must be at most ${MVP_MAX_TITLE_LENGTH} characters.`,
      );
    }

    const expiresAt = this.parseOptionalExpiration(uploadExpiresAt);

    const album: MvpAlbumRecord = {
      id: randomUUID(),
      title: title.trim(),
      guestToken: this.generateGuestToken(),
      uploadEnabled: true,
      uploadExpiresAt: expiresAt,
      createdAt: new Date().toISOString(),
    };

    await this.store.createAlbum(album);
    return this.withGuestUrl(album);
  }

  async listAlbums(): Promise<MvpAlbumWithGuestUrl[]> {
    const albums = await this.store.listAlbums();
    return albums.map((album) => this.withGuestUrl(album));
  }

  async getAlbumForOperator(albumId: string): Promise<MvpAlbumWithGuestUrl> {
    const album = await this.store.getAlbumById(albumId);
    if (album === null) {
      throw albumNotFound();
    }
    return this.withGuestUrl(album);
  }

  async setUploadsEnabled(
    albumId: string,
    enabled: boolean,
    uploadExpiresAt?: unknown,
  ): Promise<MvpAlbumWithGuestUrl> {
    const patch: Partial<
      Pick<MvpAlbumRecord, 'uploadEnabled' | 'uploadExpiresAt'>
    > = { uploadEnabled: enabled };

    if (uploadExpiresAt !== undefined) {
      patch.uploadExpiresAt = this.parseOptionalExpiration(uploadExpiresAt);
    }

    const album = await this.store.updateAlbum(albumId, patch);
    if (album === null) {
      throw albumNotFound();
    }
    return this.withGuestUrl(album);
  }

  async listMedia(albumId: string): Promise<MvpMediaRecord[]> {
    const album = await this.store.getAlbumById(albumId);
    if (album === null) {
      throw albumNotFound();
    }
    return this.store.listMediaByAlbum(albumId);
  }

  async deleteMedia(albumId: string, mediaId: string): Promise<void> {
    const media = await this.store.getMedia(albumId, mediaId);
    if (media === null) {
      throw mediaNotFound();
    }

    await this.storage.delete(media.storageKey);
    await this.store.deleteMedia(albumId, mediaId);
  }

  // ---------------------------------------------------------------
  // Guest operations
  // ---------------------------------------------------------------

  async getGuestAlbum(guestToken: string): Promise<{
    title: string;
    uploadOpen: boolean;
    uploadExpiresAt: string | null;
  }> {
    const album = await this.requireAlbumByGuestToken(guestToken);
    const availability = this.getUploadAvailability(album);

    return {
      title: album.title,
      uploadOpen: availability.allowed,
      uploadExpiresAt: album.uploadExpiresAt,
    };
  }

  /**
   * Lists album media for the guest gallery. Access is gated by the guest
   * token; storage keys and local paths are never returned. Bytes are still
   * served only through the controlled media file route.
   */
  async listGuestMedia(guestToken: string): Promise<MvpGuestMediaItem[]> {
    const album = await this.requireAlbumByGuestToken(guestToken);
    const media = await this.store.listMediaByAlbum(album.id);

    // Newest first so a guest who just uploaded sees their photo near the top.
    return [...media]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((item) => ({
        id: item.id,
        url: `/api/v1/mvp/guest/albums/${encodeURIComponent(guestToken)}/media/${encodeURIComponent(item.id)}/file`,
        createdAt: item.createdAt,
      }));
  }

  getUploadAvailability(album: MvpAlbumRecord): MvpUploadAvailability {
    if (!album.uploadEnabled) {
      return { allowed: false, reason: 'UPLOADS_CLOSED' };
    }

    if (
      album.uploadExpiresAt !== null &&
      Date.now() >= new Date(album.uploadExpiresAt).getTime()
    ) {
      return { allowed: false, reason: 'UPLOADS_EXPIRED' };
    }

    return { allowed: true };
  }

  async uploadGuestMedia(
    guestToken: string,
    files: MvpUploadFile[],
  ): Promise<MvpUploadResult> {
    const album = await this.requireAlbumByGuestToken(guestToken);

    const availability = this.getUploadAvailability(album);
    if (!availability.allowed) {
      throw availability.reason === 'UPLOADS_EXPIRED'
        ? uploadsExpired()
        : uploadsClosed();
    }

    if (files.length === 0) {
      throw validationError('Select at least one photo to upload.');
    }
    if (files.length > MVP_MAX_FILES_PER_REQUEST) {
      throw validationError(
        `At most ${MVP_MAX_FILES_PER_REQUEST} photos can be uploaded per request.`,
      );
    }

    const result: MvpUploadResult = { accepted: [], rejected: [] };

    for (const file of files) {
      const originalFilename = sanitizeOriginalFilename(file.originalname);

      if (file.size <= 0 || file.buffer.length === 0) {
        result.rejected.push({
          originalFilename,
          code: 'EMPTY_FILE',
          message: 'This file is empty.',
        });
        continue;
      }

      if (file.buffer.length > MVP_MAX_FILE_SIZE_BYTES) {
        result.rejected.push({
          originalFilename,
          code: 'FILE_TOO_LARGE',
          message: `Photos must be smaller than ${Math.floor(
            MVP_MAX_FILE_SIZE_BYTES / (1024 * 1024),
          )} MB.`,
        });
        continue;
      }

      const detectedMimeType = detectImageMimeType(file.buffer);
      if (
        detectedMimeType === null ||
        !MVP_ALLOWED_IMAGE_MIME_TYPES.includes(detectedMimeType)
      ) {
        result.rejected.push({
          originalFilename,
          code: 'UNSUPPORTED_FILE_TYPE',
          message: 'Only JPEG, PNG, WebP, GIF and HEIC photos are supported.',
        });
        continue;
      }

      const mediaId = randomUUID();
      const extension = MVP_EXTENSION_BY_MIME[detectedMimeType];
      const storageKey = `albums/${album.id}/originals/${mediaId}.${extension}`;

      await this.storage.put(storageKey, file.buffer, detectedMimeType);

      const media: MvpMediaRecord = {
        id: mediaId,
        albumId: album.id,
        storageKey,
        originalFilename,
        mimeType: detectedMimeType,
        size: file.buffer.length,
        createdAt: new Date().toISOString(),
      };

      await this.store.createMedia(media);

      result.accepted.push({
        mediaId,
        originalFilename,
        mimeType: detectedMimeType,
        size: media.size,
      });
    }

    return result;
  }

  /**
   * Serves an uploaded file only after album access has been proven through
   * the guest token. Local filesystem paths and storage keys never leave the
   * backend.
   */
  async getGuestMediaFile(
    guestToken: string,
    mediaId: string,
  ): Promise<{ media: MvpMediaRecord; object: MvpStoredObject }> {
    const album = await this.requireAlbumByGuestToken(guestToken);

    const media = await this.store.getMedia(album.id, mediaId);
    if (media === null) {
      throw mediaNotFound();
    }

    const object = await this.storage.get(media.storageKey);
    if (object === null) {
      throw mediaNotFound();
    }

    return { media, object };
  }

  // ---------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------

  private async requireAlbumByGuestToken(
    guestToken: string,
  ): Promise<MvpAlbumRecord> {
    if (
      typeof guestToken !== 'string' ||
      !/^[A-Za-z0-9_-]{16,64}$/.test(guestToken)
    ) {
      throw albumNotFound();
    }

    const album = await this.store.getAlbumByGuestToken(guestToken);
    if (album === null) {
      throw albumNotFound();
    }
    return album;
  }

  private generateGuestToken(): string {
    // 24 random bytes → 32 char base64url token, unguessable and unrelated
    // to any sequential identifier.
    return randomBytes(24).toString('base64url');
  }

  private parseOptionalExpiration(value: unknown): string | null {
    if (value === undefined || value === null || value === '') {
      return null;
    }
    if (typeof value !== 'string') {
      throw validationError(
        'uploadExpiresAt must be an ISO 8601 date string or null.',
      );
    }

    const timestamp = new Date(value);
    if (Number.isNaN(timestamp.getTime())) {
      throw validationError(
        'uploadExpiresAt must be a valid ISO 8601 date string.',
      );
    }

    return timestamp.toISOString();
  }

  private withGuestUrl(album: MvpAlbumRecord): MvpAlbumWithGuestUrl {
    return { ...album, guestUrl: buildGuestUrl(this.config, album.guestToken) };
  }
}
