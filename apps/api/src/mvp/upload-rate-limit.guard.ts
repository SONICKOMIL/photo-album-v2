import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from '@nestjs/common';
import type { Request } from 'express';
import { tooManyRequests } from './mvp.errors';

type WindowState = {
  count: number;
  resetAt: number;
};

const WINDOW_MS = 10 * 60 * 1000;
/**
 * Deliberately generous: guests at one event often share a single network/IP
 * (see ARCHITECTURE.md §46), so this limit only protects against abuse, not
 * against normal event traffic. Redis-based limiting belongs to later phases.
 */
const MAX_UPLOAD_REQUESTS_PER_WINDOW = 120;

/** Simple in-process fixed-window rate limit for guest upload requests. */
@Injectable()
export class UploadRateLimitGuard implements CanActivate {
  private readonly windows = new Map<string, WindowState>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.ip ?? 'unknown';
    const now = Date.now();

    const state = this.windows.get(key);
    if (state === undefined || now >= state.resetAt) {
      this.windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
      this.cleanup(now);
      return true;
    }

    if (state.count >= MAX_UPLOAD_REQUESTS_PER_WINDOW) {
      throw tooManyRequests();
    }

    state.count += 1;
    return true;
  }

  private cleanup(now: number): void {
    if (this.windows.size < 1000) {
      return;
    }
    for (const [key, state] of this.windows) {
      if (now >= state.resetAt) {
        this.windows.delete(key);
      }
    }
  }
}
