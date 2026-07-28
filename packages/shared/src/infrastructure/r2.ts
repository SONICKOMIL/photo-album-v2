import { HeadBucketCommand, S3Client } from '@aws-sdk/client-s3';
import type { R2Config } from '@livara/config';

export function createR2Client(config: R2Config): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: true,
  });
}

export async function verifyR2Connectivity(config: R2Config): Promise<void> {
  const client = createR2Client(config);

  try {
    await client.send(
      new HeadBucketCommand({
        Bucket: config.bucketName,
      }),
    );
  } finally {
    client.destroy();
  }
}
