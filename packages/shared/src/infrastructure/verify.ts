import type { R2Config } from '@livara/config';
import { verifyPostgresConnectivity } from './postgres';
import { verifyRedisConnectivity } from './redis';
import { verifyR2Connectivity } from './r2';

export type InfrastructureVerificationInput = {
  databaseUrl: string;
  redisUrl: string;
  r2: R2Config | null;
};

export type InfrastructureVerificationResult = {
  postgres: 'ok';
  redis: 'ok';
  r2: 'ok' | 'skipped';
};

export async function verifyBackendInfrastructure(
  input: InfrastructureVerificationInput,
): Promise<InfrastructureVerificationResult> {
  await verifyPostgresConnectivity(input.databaseUrl);
  await verifyRedisConnectivity(input.redisUrl);

  if (input.r2 === null) {
    return {
      postgres: 'ok',
      redis: 'ok',
      r2: 'skipped',
    };
  }

  await verifyR2Connectivity(input.r2);

  return {
    postgres: 'ok',
    redis: 'ok',
    r2: 'ok',
  };
}
