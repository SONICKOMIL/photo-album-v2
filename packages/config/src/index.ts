export const APP_NAME = 'Livara';

export const APP_VERSION = '0.1.0';

export const NODE_ENV_VALUES = ['development', 'test', 'production'] as const;

export type NodeEnvironment = (typeof NODE_ENV_VALUES)[number];

export type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  endpoint: string;
};

export function getNodeEnvironment(value: string | undefined): NodeEnvironment {
  const environment = value ?? 'development';

  if (!NODE_ENV_VALUES.includes(environment as NodeEnvironment)) {
    throw new Error(
      `Invalid NODE_ENV "${environment}". Expected: ${NODE_ENV_VALUES.join(', ')}`,
    );
  }

  return environment as NodeEnvironment;
}

export function getPort(
  value: string | undefined,
  fallback: number,
  variableName: string,
): number {
  if (value === undefined || value === '') {
    return fallback;
  }

  const port = Number(value);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `Invalid ${variableName} "${value}". Expected an integer between 1 and 65535.`,
    );
  }

  return port;
}

export function getRequiredString(
  value: unknown,
  variableName: string,
): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required environment variable ${variableName}.`);
  }

  return value.trim();
}

export function getOptionalString(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export function getDatabaseUrl(value: unknown): string {
  const databaseUrl = getRequiredString(value, 'DATABASE_URL');

  if (
    !databaseUrl.startsWith('postgresql://') &&
    !databaseUrl.startsWith('postgres://')
  ) {
    throw new Error(
      'Invalid DATABASE_URL. Expected a PostgreSQL connection string.',
    );
  }

  return databaseUrl;
}

export function getRedisUrl(value: unknown): string {
  const redisUrl = getRequiredString(value, 'REDIS_URL');

  if (!redisUrl.startsWith('redis://') && !redisUrl.startsWith('rediss://')) {
    throw new Error('Invalid REDIS_URL. Expected a Redis connection string.');
  }

  return redisUrl;
}

export function getOptionalR2Config(
  environment: Record<string, unknown>,
): R2Config | null {
  const accountId = getOptionalString(environment.R2_ACCOUNT_ID);
  const accessKeyId = getOptionalString(environment.R2_ACCESS_KEY_ID);
  const secretAccessKey = getOptionalString(environment.R2_SECRET_ACCESS_KEY);
  const bucketName = getOptionalString(environment.R2_BUCKET_NAME);
  const endpoint = getOptionalString(environment.R2_ENDPOINT);

  const values = [
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
    endpoint,
  ];
  const providedCount = values.filter((value) => value !== undefined).length;

  if (providedCount === 0) {
    return null;
  }

  if (providedCount < values.length) {
    throw new Error(
      'Incomplete R2 configuration. Set all of R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, and R2_ENDPOINT, or leave all empty for local development without R2.',
    );
  }

  return {
    accountId: accountId as string,
    accessKeyId: accessKeyId as string,
    secretAccessKey: secretAccessKey as string,
    bucketName: bucketName as string,
    endpoint: endpoint as string,
  };
}
