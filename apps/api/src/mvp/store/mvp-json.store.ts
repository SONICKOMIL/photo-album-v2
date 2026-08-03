import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import type { MvpAlbumRecord, MvpMediaRecord, MvpStore } from '../mvp.types';

type StoreFileShape = {
  version: 1;
  albums: MvpAlbumRecord[];
  media: MvpMediaRecord[];
};

const EMPTY_STORE: StoreFileShape = {
  version: 1,
  albums: [],
  media: [],
};

/**
 * TEMPORARY PERSISTENCE — Manual MVP only.
 *
 * A single-process JSON file store for album/media metadata, used because
 * PostgreSQL/Prisma (Roadmap Phase 3) is not implemented yet and PostgreSQL
 * infrastructure is unavailable on this machine. It deliberately does NOT
 * pretend to be the final database architecture:
 *
 * - It lives in a gitignored runtime data directory.
 * - It is accessed only through the MvpStore interface, so it can be
 *   replaced by a Prisma-backed implementation without touching the
 *   upload/domain logic.
 *
 * Mutations are serialized through an in-process queue and persisted with an
 * atomic write (temp file + rename).
 */
export class MvpJsonStore implements MvpStore {
  private albums = new Map<string, MvpAlbumRecord>();
  private albumIdByGuestToken = new Map<string, string>();
  private media = new Map<string, MvpMediaRecord>();
  private initialized = false;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(private readonly filePath: string) {}

  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await fs.mkdir(path.dirname(this.filePath), { recursive: true });

    let parsed: StoreFileShape = EMPTY_STORE;
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      parsed = JSON.parse(raw) as StoreFileShape;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT') {
        throw new Error(
          `MVP store file at ${this.filePath} could not be read or parsed. ` +
            'Fix or remove the file before starting the API.',
          { cause: error },
        );
      }
    }

    for (const album of parsed.albums ?? []) {
      this.albums.set(album.id, album);
      this.albumIdByGuestToken.set(album.guestToken, album.id);
    }
    for (const media of parsed.media ?? []) {
      this.media.set(media.id, media);
    }

    this.initialized = true;
  }

  createAlbum(record: MvpAlbumRecord): Promise<void> {
    return this.mutate(() => {
      this.albums.set(record.id, record);
      this.albumIdByGuestToken.set(record.guestToken, record.id);
    });
  }

  getAlbumById(albumId: string): Promise<MvpAlbumRecord | null> {
    return Promise.resolve(this.albums.get(albumId) ?? null);
  }

  getAlbumByGuestToken(guestToken: string): Promise<MvpAlbumRecord | null> {
    const albumId = this.albumIdByGuestToken.get(guestToken);
    if (albumId === undefined) {
      return Promise.resolve(null);
    }
    return this.getAlbumById(albumId);
  }

  listAlbums(): Promise<MvpAlbumRecord[]> {
    const albums = [...this.albums.values()].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt),
    );
    return Promise.resolve(albums);
  }

  async updateAlbum(
    albumId: string,
    patch: Partial<Pick<MvpAlbumRecord, 'uploadEnabled' | 'uploadExpiresAt'>>,
  ): Promise<MvpAlbumRecord | null> {
    const existing = this.albums.get(albumId);
    if (existing === undefined) {
      return null;
    }

    const updated: MvpAlbumRecord = { ...existing, ...patch };
    await this.mutate(() => {
      this.albums.set(albumId, updated);
    });
    return updated;
  }

  createMedia(record: MvpMediaRecord): Promise<void> {
    return this.mutate(() => {
      this.media.set(record.id, record);
    });
  }

  listMediaByAlbum(albumId: string): Promise<MvpMediaRecord[]> {
    const items = [...this.media.values()]
      .filter((media) => media.albumId === albumId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return Promise.resolve(items);
  }

  getMedia(albumId: string, mediaId: string): Promise<MvpMediaRecord | null> {
    const media = this.media.get(mediaId);
    if (media === undefined || media.albumId !== albumId) {
      return Promise.resolve(null);
    }
    return Promise.resolve(media);
  }

  async deleteMedia(albumId: string, mediaId: string): Promise<boolean> {
    const media = this.media.get(mediaId);
    if (media === undefined || media.albumId !== albumId) {
      return false;
    }

    await this.mutate(() => {
      this.media.delete(mediaId);
    });
    return true;
  }

  private mutate(apply: () => void): Promise<void> {
    const next = this.writeQueue.then(async () => {
      apply();
      await this.persist();
    });
    // Keep the queue alive even if one persist fails; the failure is still
    // surfaced to the caller through `next`.
    this.writeQueue = next.catch(() => undefined);
    return next;
  }

  private async persist(): Promise<void> {
    const snapshot: StoreFileShape = {
      version: 1,
      albums: [...this.albums.values()],
      media: [...this.media.values()],
    };

    const temporaryPath = `${this.filePath}.tmp`;
    await fs.writeFile(
      temporaryPath,
      JSON.stringify(snapshot, null, 2),
      'utf8',
    );
    await fs.rename(temporaryPath, this.filePath);
  }
}
