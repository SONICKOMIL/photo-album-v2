import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { MvpConfig } from './mvp.config';
import { MvpApiException } from './mvp.errors';
import { MvpService, type MvpUploadFile } from './mvp.service';
import { MVP_MAX_FILE_SIZE_BYTES } from './mvp.validation';
import { LocalFsStorageAdapter } from './storage/local-fs.storage';
import { MvpJsonStore } from './store/mvp-json.store';

function jpegBuffer(size = 1024): Buffer {
  const buffer = Buffer.alloc(size);
  buffer[0] = 0xff;
  buffer[1] = 0xd8;
  buffer[2] = 0xff;
  buffer[3] = 0xe0;
  return buffer;
}

function pngBuffer(size = 1024): Buffer {
  const buffer = Buffer.alloc(size);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer);
  return buffer;
}

function uploadFile(
  buffer: Buffer,
  originalname = 'photo.jpg',
  mimetype = 'image/jpeg',
): MvpUploadFile {
  return { originalname, mimetype, size: buffer.length, buffer };
}

async function expectMvpError(
  action: Promise<unknown>,
  expectedCode: string,
): Promise<void> {
  await expect(action).rejects.toBeInstanceOf(MvpApiException);
  try {
    await action;
  } catch (error) {
    const response = (error as MvpApiException).getResponse() as {
      error: { code: string };
    };
    expect(response.error.code).toBe(expectedCode);
  }
}

describe('MvpService (temporary Manual MVP)', () => {
  let workDir: string;
  let storePath: string;
  let uploadDir: string;
  let service: MvpService;
  let store: MvpJsonStore;

  const config: MvpConfig = {
    dataDir: '',
    uploadDir: '',
    operatorKey: 'test-operator-key',
    publicWebUrl: 'http://localhost:3000',
  };

  beforeEach(async () => {
    workDir = await fs.mkdtemp(path.join(os.tmpdir(), 'livara-mvp-test-'));
    storePath = path.join(workDir, 'mvp-store.json');
    uploadDir = path.join(workDir, 'uploads');

    store = new MvpJsonStore(storePath);
    await store.init();

    service = new MvpService(store, new LocalFsStorageAdapter(uploadDir), {
      ...config,
      dataDir: workDir,
      uploadDir,
    });
  });

  afterEach(async () => {
    await fs.rm(workDir, { recursive: true, force: true });
  });

  describe('album creation', () => {
    it('creates an album with a secure guest token and persists it', async () => {
      const album = await service.createAlbum('Aziz & Madina');

      expect(album.title).toBe('Aziz & Madina');
      expect(album.uploadEnabled).toBe(true);
      expect(album.uploadExpiresAt).toBeNull();
      expect(album.guestToken).toMatch(/^[A-Za-z0-9_-]{32}$/);
      expect(album.guestToken).not.toContain(album.id);
      expect(album.guestUrl).toBe(
        `http://localhost:3000/a/${album.guestToken}`,
      );

      // A fresh store instance must read the same album back from disk.
      const reloaded = new MvpJsonStore(storePath);
      await reloaded.init();
      const persisted = await reloaded.getAlbumByGuestToken(album.guestToken);
      expect(persisted?.id).toBe(album.id);
    });

    it('rejects an empty title', async () => {
      await expectMvpError(service.createAlbum(''), 'VALIDATION_ERROR');
    });

    it('rejects an invalid uploadExpiresAt', async () => {
      await expectMvpError(
        service.createAlbum('Test', 'not-a-date'),
        'VALIDATION_ERROR',
      );
    });
  });

  describe('guest album access', () => {
    it('rejects an unknown guest token', async () => {
      await expectMvpError(
        service.getGuestAlbum('unknown-token-unknown-token'),
        'ALBUM_NOT_FOUND',
      );
    });

    it('rejects malformed guest tokens without a store lookup', async () => {
      await expectMvpError(
        service.getGuestAlbum('../../../etc/passwd'),
        'ALBUM_NOT_FOUND',
      );
    });

    it('returns guest-safe album data', async () => {
      const album = await service.createAlbum('Wedding');
      const guestView = await service.getGuestAlbum(album.guestToken);

      expect(guestView).toEqual({
        title: 'Wedding',
        uploadOpen: true,
        uploadExpiresAt: null,
      });
    });
  });

  describe('guest gallery media list', () => {
    it('rejects an unknown guest token', async () => {
      await expectMvpError(
        service.listGuestMedia('unknown-token-unknown-token'),
        'ALBUM_NOT_FOUND',
      );
    });

    it('returns safe metadata without storage keys and remains readable when uploads are closed', async () => {
      const album = await service.createAlbum('Gallery Event');
      const uploaded = await service.uploadGuestMedia(album.guestToken, [
        uploadFile(jpegBuffer(), 'one.jpg'),
        uploadFile(pngBuffer(), 'two.png', 'image/png'),
      ]);
      expect(uploaded.accepted).toHaveLength(2);

      await service.setUploadsEnabled(album.id, false);

      const items = await service.listGuestMedia(album.guestToken);
      expect(items).toHaveLength(2);

      for (const item of items) {
        expect(item.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
        );
        expect(item.url).toBe(
          `/api/v1/mvp/guest/albums/${encodeURIComponent(album.guestToken)}/media/${encodeURIComponent(item.id)}/file`,
        );
        expect(item.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        expect(item).not.toHaveProperty('storageKey');
        expect(item).not.toHaveProperty('originalFilename');
        expect(JSON.stringify(item)).not.toContain(uploadDir);
      }

      // Newest first
      expect(items[0].createdAt >= items[1].createdAt).toBe(true);
    });
  });

  describe('upload rules', () => {
    it('rejects uploads when the album is closed', async () => {
      const album = await service.createAlbum('Closed Event');
      await service.setUploadsEnabled(album.id, false);

      await expectMvpError(
        service.uploadGuestMedia(album.guestToken, [uploadFile(jpegBuffer())]),
        'UPLOADS_CLOSED',
      );
    });

    it('rejects uploads after the upload window has expired', async () => {
      const past = new Date(Date.now() - 60_000).toISOString();
      const album = await service.createAlbum('Expired Event', past);

      await expectMvpError(
        service.uploadGuestMedia(album.guestToken, [uploadFile(jpegBuffer())]),
        'UPLOADS_EXPIRED',
      );
    });

    it('rejects files that are not real images regardless of name/mime', async () => {
      const album = await service.createAlbum('Strict Event');
      const fake = Buffer.from('<script>alert(1)</script> not an image');

      const result = await service.uploadGuestMedia(album.guestToken, [
        uploadFile(fake, 'totally-a-photo.jpg', 'image/jpeg'),
      ]);

      expect(result.accepted).toHaveLength(0);
      expect(result.rejected).toHaveLength(1);
      expect(result.rejected[0].code).toBe('UNSUPPORTED_FILE_TYPE');
    });

    it('rejects oversized files', async () => {
      const album = await service.createAlbum('Big Files Event');
      const oversized = jpegBuffer(MVP_MAX_FILE_SIZE_BYTES + 1);

      const result = await service.uploadGuestMedia(album.guestToken, [
        uploadFile(oversized, 'huge.jpg'),
      ]);

      expect(result.accepted).toHaveLength(0);
      expect(result.rejected[0].code).toBe('FILE_TOO_LARGE');
    });

    it('accepts valid images independently and persists them to storage', async () => {
      const album = await service.createAlbum('Mixed Upload');

      const result = await service.uploadGuestMedia(album.guestToken, [
        uploadFile(jpegBuffer(), 'one.jpg'),
        uploadFile(Buffer.from('not an image'), 'two.jpg'),
        uploadFile(pngBuffer(), 'three.png', 'image/png'),
      ]);

      expect(result.accepted).toHaveLength(2);
      expect(result.rejected).toHaveLength(1);

      const media = await service.listMedia(album.id);
      expect(media).toHaveLength(2);

      for (const item of media) {
        // Server generates the storage key; user filename never becomes a path.
        expect(item.storageKey).toMatch(
          new RegExp(`^albums/${album.id}/originals/[0-9a-f-]+\\.(jpg|png)$`),
        );
        const stored = await fs.stat(path.join(uploadDir, item.storageKey));
        expect(stored.isFile()).toBe(true);
      }
    });

    it('sanitizes hostile filenames in metadata', async () => {
      const album = await service.createAlbum('Hostile Filenames');

      const result = await service.uploadGuestMedia(album.guestToken, [
        uploadFile(jpegBuffer(), '..\\..\\evil/../../name.jpg'),
      ]);

      expect(result.accepted).toHaveLength(1);
      expect(result.accepted[0].originalFilename).not.toContain('/');
      expect(result.accepted[0].originalFilename).not.toContain('\\');
    });
  });

  describe('operator moderation', () => {
    it('lists and deletes uploaded media including the stored file', async () => {
      const album = await service.createAlbum('Moderated Event');
      const result = await service.uploadGuestMedia(album.guestToken, [
        uploadFile(jpegBuffer(), 'keep.jpg'),
        uploadFile(jpegBuffer(), 'remove.jpg'),
      ]);
      expect(result.accepted).toHaveLength(2);

      const [, toDelete] = await service.listMedia(album.id);
      const storedPath = path.join(uploadDir, toDelete.storageKey);
      await expect(fs.stat(storedPath)).resolves.toBeDefined();

      await service.deleteMedia(album.id, toDelete.id);

      const remaining = await service.listMedia(album.id);
      expect(remaining).toHaveLength(1);
      await expect(fs.stat(storedPath)).rejects.toBeDefined();
    });

    it('closing uploads immediately blocks new uploads and reopening restores them', async () => {
      const album = await service.createAlbum('Toggle Event');

      await service.setUploadsEnabled(album.id, false);
      await expectMvpError(
        service.uploadGuestMedia(album.guestToken, [uploadFile(jpegBuffer())]),
        'UPLOADS_CLOSED',
      );

      await service.setUploadsEnabled(album.id, true);
      const result = await service.uploadGuestMedia(album.guestToken, [
        uploadFile(jpegBuffer()),
      ]);
      expect(result.accepted).toHaveLength(1);
    });
  });
});
