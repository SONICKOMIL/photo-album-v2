import { createReadStream, promises as fs, type Stats } from 'node:fs';
import * as path from 'node:path';
import type { MvpStorageAdapter, MvpStoredObject } from '../mvp.types';
import { isSafeStorageKey } from '../mvp.validation';

/**
 * TEMPORARY LOCAL STORAGE — Manual MVP fallback.
 *
 * Used only when Cloudflare R2 credentials are not configured, so the
 * complete MVP flow can run and be tested locally today. Files live in a
 * gitignored runtime directory and are served exclusively through the
 * controlled API route that verifies album access — there is no public
 * directory listing and filesystem paths are never exposed.
 *
 * Replaced by the R2 adapter (same MvpStorageAdapter interface) as soon as
 * real R2 credentials are available; upload/domain logic is unchanged.
 */
export class LocalFsStorageAdapter implements MvpStorageAdapter {
  readonly kind = 'local-fs' as const;

  constructor(private readonly rootDir: string) {}

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    // The local adapter derives no behavior from the content type; it is part
    // of the storage interface for the R2 implementation.
    void contentType;

    const filePath = this.resolveSafePath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, body);
  }

  async get(key: string): Promise<MvpStoredObject | null> {
    const filePath = this.resolveSafePath(key);

    let stats: Stats;
    try {
      stats = await fs.stat(filePath);
    } catch {
      return null;
    }

    if (!stats.isFile()) {
      return null;
    }

    return {
      body: createReadStream(filePath),
      size: stats.size,
    };
  }

  async delete(key: string): Promise<void> {
    const filePath = this.resolveSafePath(key);
    await fs.rm(filePath, { force: true });
  }

  private resolveSafePath(key: string): string {
    if (!isSafeStorageKey(key)) {
      throw new Error('Unsafe storage key rejected.');
    }

    const resolved = path.resolve(this.rootDir, key);
    const rootWithSeparator = path.resolve(this.rootDir) + path.sep;

    if (!resolved.startsWith(rootWithSeparator)) {
      throw new Error('Storage key escapes the upload directory.');
    }

    return resolved;
  }
}
