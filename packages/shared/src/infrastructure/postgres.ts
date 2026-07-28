import { Client } from 'pg';

export async function verifyPostgresConnectivity(
  databaseUrl: string,
): Promise<void> {
  const client = new Client({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5_000,
  });

  try {
    await client.connect();
    const result = await client.query<{ ok: number }>('SELECT 1 AS ok');

    if (result.rows[0]?.ok !== 1) {
      throw new Error('Unexpected PostgreSQL connectivity response.');
    }
  } catch (error) {
    const detail =
      error instanceof Error ? error.message || error.name : String(error);

    throw new Error(
      `PostgreSQL connectivity failed for DATABASE_URL. ${detail}`,
      { cause: error },
    );
  } finally {
    await client.end().catch(() => undefined);
  }
}
