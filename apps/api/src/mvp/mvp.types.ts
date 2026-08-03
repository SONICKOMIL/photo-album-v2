/**
 * TEMPORARY MANUAL MVP TYPES
 *
 * This module belongs to the temporary manual operational mode described in
 * docs/MVP_MANUAL_OPERATIONS.md. It intentionally implements only the minimum
 * vertical slice (album + uploaded media) and is NOT the Phase 3 data model
 * from docs/DATABASE.md.
 *
 * The store and storage interfaces below exist so this persistence can be
 * replaced by Prisma/PostgreSQL (Phase 3) and Cloudflare R2 direct upload
 * (Phase 11) without rewriting the upload/domain logic.
 */

import type { Readable } from 'node:stream';

export type MvpAlbumRecord = {
  id: string;
  title: string;
  /** Cryptographically random public guest access token (not a sequential ID). */
  guestToken: string;
  /**
   * Manual upload switch for the manual MVP only. The documented long-term
   * architecture derives upload availability from Upload Windows (Phase 9);
   * this flag is a temporary operator control and must not survive into the
   * Prisma schema.
   */
  uploadEnabled: boolean;
  /** Optional upload expiration, ISO 8601 UTC. Null = no expiration. */
  uploadExpiresAt: string | null;
  createdAt: string;
};

export type MvpMediaRecord = {
  id: string;
  albumId: string;
  /** Server-generated object storage key. Never derived from user filenames. */
  storageKey: string;
  /** Sanitized original filename kept as metadata only. */
  originalFilename: string;
  /** MIME type validated from file content (magic bytes), not client input. */
  mimeType: string;
  size: number;
  createdAt: string;
};

export interface MvpStore {
  init(): Promise<void>;
  createAlbum(record: MvpAlbumRecord): Promise<void>;
  getAlbumById(albumId: string): Promise<MvpAlbumRecord | null>;
  getAlbumByGuestToken(guestToken: string): Promise<MvpAlbumRecord | null>;
  listAlbums(): Promise<MvpAlbumRecord[]>;
  updateAlbum(
    albumId: string,
    patch: Partial<Pick<MvpAlbumRecord, 'uploadEnabled' | 'uploadExpiresAt'>>,
  ): Promise<MvpAlbumRecord | null>;
  createMedia(record: MvpMediaRecord): Promise<void>;
  listMediaByAlbum(albumId: string): Promise<MvpMediaRecord[]>;
  getMedia(albumId: string, mediaId: string): Promise<MvpMediaRecord | null>;
  deleteMedia(albumId: string, mediaId: string): Promise<boolean>;
}

export type MvpStoredObject = {
  body: Readable;
  contentType?: string;
  size?: number;
};

export interface MvpStorageAdapter {
  readonly kind: 'local-fs' | 'r2';
  put(key: string, body: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<MvpStoredObject | null>;
  delete(key: string): Promise<void>;
}

export const MVP_CONFIG = Symbol('MVP_CONFIG');
export const MVP_STORE = Symbol('MVP_STORE');
export const MVP_STORAGE = Symbol('MVP_STORAGE');
