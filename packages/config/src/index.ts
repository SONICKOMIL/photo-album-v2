export const APP_NAME = 'Livara';

export const APP_VERSION = '0.1.0';

export const NODE_ENV_VALUES = ['development', 'test', 'production'] as const;

export type NodeEnvironment = (typeof NODE_ENV_VALUES)[number];

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
