import { Readable } from 'node:stream';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  type S3Client,
} from '@aws-sdk/client-s3';
import type { R2Config } from '@livara/config';
import { createR2Client } from '@livara/shared';
import type { MvpStorageAdapter, MvpStoredObject } from '../mvp.types';
import { isSafeStorageKey } from '../mvp.validation';

/**
 * Cloudflare R2 storage adapter for the Manual MVP, reusing the Phase 2 R2
 * client infrastructure. Selected automatically when complete R2 credentials
 * are configured in the environment.
 *
 * The bucket stays private: objects are written and read only with
 * server-side credentials, and media is served through the controlled API
 * route that verifies album access. No permanent public object URLs are
 * exposed.
 *
 * NOTE (temporary deviation): the Manual MVP transfers upload bytes through
 * the API instead of the documented direct-to-R2 signed upload flow, which
 * belongs to Roadmap Phase 11. The adapter interface keeps that migration
 * contained.
 */
export class R2StorageAdapter implements MvpStorageAdapter {
  readonly kind = 'r2' as const;

  private readonly client: S3Client;
  private readonly bucketName: string;

  constructor(config: R2Config) {
    this.client = createR2Client(config);
    this.bucketName = config.bucketName;
  }

  async put(key: string, body: Buffer, contentType: string): Promise<void> {
    this.assertSafeKey(key);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }

  async get(key: string): Promise<MvpStoredObject | null> {
    this.assertSafeKey(key);

    try {
      const result = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      if (result.Body === undefined) {
        return null;
      }

      return {
        body: result.Body as Readable,
        contentType: result.ContentType,
        size: result.ContentLength,
      };
    } catch (error) {
      if ((error as { name?: string }).name === 'NoSuchKey') {
        return null;
      }
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    this.assertSafeKey(key);
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      }),
    );
  }

  private assertSafeKey(key: string): void {
    if (!isSafeStorageKey(key)) {
      throw new Error('Unsafe storage key rejected.');
    }
  }
}
