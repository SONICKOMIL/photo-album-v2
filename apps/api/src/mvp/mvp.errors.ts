import { HttpException } from '@nestjs/common';

/**
 * Stable product error codes in the response shape defined by docs/API.md:
 * { "success": false, "error": { "code": "...", "message": "..." } }
 */
export class MvpApiException extends HttpException {
  constructor(status: number, code: string, message: string) {
    super({ success: false, error: { code, message } }, status);
  }
}

export function albumNotFound(): MvpApiException {
  return new MvpApiException(
    404,
    'ALBUM_NOT_FOUND',
    'This album could not be found.',
  );
}

export function uploadsClosed(): MvpApiException {
  return new MvpApiException(
    403,
    'UPLOADS_CLOSED',
    'This album is not accepting new memories right now.',
  );
}

export function uploadsExpired(): MvpApiException {
  return new MvpApiException(
    403,
    'UPLOADS_EXPIRED',
    'The upload period for this album has ended.',
  );
}

export function validationError(message: string): MvpApiException {
  return new MvpApiException(422, 'VALIDATION_ERROR', message);
}

export function mediaNotFound(): MvpApiException {
  return new MvpApiException(
    404,
    'MEDIA_NOT_FOUND',
    'This memory could not be found.',
  );
}

export function tooManyRequests(): MvpApiException {
  return new MvpApiException(
    429,
    'TOO_MANY_REQUESTS',
    'Too many uploads right now. Please try again in a moment.',
  );
}
