import * as fs from 'node:fs';
import * as path from 'node:path';

export type MvpConfig = {
  dataDir: string;
  uploadDir: string;
  operatorKey: string | null;
  publicWebUrl: string;
};

export type MvpEnvironment = {
  MVP_DATA_DIR?: string;
  MVP_UPLOAD_DIR?: string;
  MVP_OPERATOR_KEY?: string;
  MVP_PUBLIC_WEB_URL?: string;
};

function hasWorkspacesField(packageJsonPath: string): boolean {
  try {
    const parsed: unknown = JSON.parse(
      fs.readFileSync(packageJsonPath, 'utf8'),
    );
    return (
      typeof parsed === 'object' &&
      parsed !== null &&
      'workspaces' in (parsed as Record<string, unknown>)
    );
  } catch {
    return false;
  }
}

/**
 * Applications run from apps/api during development, so relative MVP paths
 * are resolved against the monorepo root (the nearest package.json with a
 * "workspaces" field) to keep runtime data in one gitignored place.
 */
export function findRepoRoot(startDir: string = process.cwd()): string {
  let current = path.resolve(startDir);

  for (;;) {
    if (hasWorkspacesField(path.join(current, 'package.json'))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return path.resolve(startDir);
    }
    current = parent;
  }
}

function normalized(value: string | undefined): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export function resolveMvpConfig(
  environment: MvpEnvironment = process.env,
  repoRoot: string = findRepoRoot(),
): MvpConfig {
  const resolveDir = (value: string | undefined, fallback: string): string => {
    const raw = normalized(value) ?? fallback;
    return path.isAbsolute(raw) ? raw : path.resolve(repoRoot, raw);
  };

  const dataDir = resolveDir(environment.MVP_DATA_DIR, 'data/mvp');
  const uploadDir = resolveDir(
    environment.MVP_UPLOAD_DIR,
    path.join(dataDir, 'uploads'),
  );

  return {
    dataDir,
    uploadDir,
    operatorKey: normalized(environment.MVP_OPERATOR_KEY) ?? null,
    publicWebUrl: (
      normalized(environment.MVP_PUBLIC_WEB_URL) ?? 'http://localhost:3000'
    ).replace(/\/+$/, ''),
  };
}

export function buildGuestUrl(config: MvpConfig, guestToken: string): string {
  return `${config.publicWebUrl}/a/${guestToken}`;
}
