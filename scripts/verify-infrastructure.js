/**
 * Verifies local backend infrastructure connectivity.
 *
 * Loads environment variables from the repository root `.env` when present,
 * then falls back to process environment values.
 *
 * Usage:
 *   npm run infra:verify
 */
const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const {
  getDatabaseUrl,
  getOptionalR2Config,
  getRedisUrl,
} = require('@livara/config');
const { verifyBackendInfrastructure } = require('@livara/shared');

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const contents = readFileSync(filePath, 'utf8');

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (line === '' || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function main() {
  const root = resolve(__dirname, '..');

  loadEnvFile(resolve(root, '.env'));
  loadEnvFile(resolve(root, 'apps/api/.env'));
  loadEnvFile(resolve(root, 'apps/worker/.env'));

  const databaseUrl = getDatabaseUrl(process.env.DATABASE_URL);
  const redisUrl = getRedisUrl(process.env.REDIS_URL);
  const r2 = getOptionalR2Config(process.env);

  const result = await verifyBackendInfrastructure({
    databaseUrl,
    redisUrl,
    r2,
  });

  console.log(`PostgreSQL: ${result.postgres}`);
  console.log(`Redis: ${result.redis}`);

  if (result.r2 === 'skipped') {
    console.log(
      'R2: skipped (credentials not configured — real R2 connectivity remains unverified)',
    );
  } else {
    console.log(`R2: ${result.r2}`);
  }
}

main().catch((error) => {
  console.error('Infrastructure verification failed.');

  if (error instanceof Error) {
    console.error(error.message || error.name);
    if (error.cause) {
      console.error(String(error.cause));
    }
  } else {
    console.error(String(error));
  }

  process.exitCode = 1;
});
