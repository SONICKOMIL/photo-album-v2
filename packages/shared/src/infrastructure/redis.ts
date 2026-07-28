import Redis from 'ioredis';

export async function verifyRedisConnectivity(redisUrl: string): Promise<void> {
  const client = new Redis(redisUrl, {
    lazyConnect: true,
    maxRetriesPerRequest: 1,
    connectTimeout: 5_000,
    enableOfflineQueue: false,
  });

  try {
    await client.connect();
    const response = await client.ping();

    if (response !== 'PONG') {
      throw new Error(
        `Unexpected Redis connectivity response: ${String(response)}`,
      );
    }
  } catch (error) {
    const detail =
      error instanceof Error ? error.message || error.name : String(error);

    throw new Error(`Redis connectivity failed for REDIS_URL. ${detail}`, {
      cause: error,
    });
  } finally {
    client.disconnect();
  }
}
