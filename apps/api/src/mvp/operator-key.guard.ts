import { timingSafeEqual } from 'node:crypto';
import {
  Inject,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import type { MvpConfig } from './mvp.config';
import { MvpApiException } from './mvp.errors';
import { MVP_CONFIG } from './mvp.types';

export const MVP_OPERATOR_KEY_HEADER = 'x-livara-mvp-operator-key';

/**
 * TEMPORARY OPERATOR PROTECTION — Manual MVP only.
 *
 * The internal operator endpoints are driven by the local operator CLI and
 * require a shared secret from the environment (MVP_OPERATOR_KEY). While the
 * key is not configured, operator endpoints are disabled entirely, so this
 * can never silently become an unrestricted public API.
 *
 * This is NOT the future authentication architecture: real Super Admin /
 * Organizer authentication belongs to Roadmap Phases 5–7 and replaces this
 * guard.
 */
@Injectable()
export class OperatorKeyGuard implements CanActivate {
  constructor(@Inject(MVP_CONFIG) private readonly config: MvpConfig) {}

  canActivate(context: ExecutionContext): boolean {
    const configuredKey = this.config.operatorKey;
    if (configuredKey === null) {
      throw new MvpApiException(
        503,
        'OPERATOR_API_DISABLED',
        'Operator endpoints are disabled. Set MVP_OPERATOR_KEY to enable them.',
      );
    }

    const request = context.switchToHttp().getRequest<Request>();
    const providedKey = request.headers[MVP_OPERATOR_KEY_HEADER];

    if (typeof providedKey !== 'string' || providedKey === '') {
      throw new MvpApiException(
        401,
        'OPERATOR_KEY_REQUIRED',
        'Missing operator key.',
      );
    }

    const provided = Buffer.from(providedKey, 'utf8');
    const expected = Buffer.from(configuredKey, 'utf8');

    if (
      provided.length !== expected.length ||
      !timingSafeEqual(provided, expected)
    ) {
      throw new MvpApiException(
        401,
        'OPERATOR_KEY_INVALID',
        'Invalid operator key.',
      );
    }

    return true;
  }
}
