#!/usr/bin/env node
/**
 * TEMPORARY MANUAL MVP OPERATOR CLI — see docs/MVP_MANUAL_OPERATIONS.md.
 *
 * Drives the internal operator endpoints of the running API using the shared
 * secret from MVP_OPERATOR_KEY in the root .env. This tooling exists so the
 * first customers can be operated manually before the Super Admin dashboard
 * (Roadmap Phase 24) exists. It is not a production admin surface.
 *
 * Usage (via root npm scripts):
 *   npm run mvp:album:create -- "Aziz & Madina" [--expires 2026-09-20T18:00:00Z]
 *   npm run mvp:album:list
 *   npm run mvp:album:url -- <albumId|guestToken|prefix>
 *   npm run mvp:uploads:open -- <albumId> [--expires <iso>]
 *   npm run mvp:uploads:close -- <albumId>
 *   npm run mvp:media:list -- <albumId>
 *   npm run mvp:media:delete -- <albumId> <mediaId>
 *   npm run mvp:qr -- <albumId|guestToken|prefix>
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
);

function parseEnvFile(content) {
  const result = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      continue;
    }
    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    result[key] = value;
  }
  return result;
}

async function loadEnvironment() {
  let fileEnv = {};
  try {
    fileEnv = parseEnvFile(await fs.readFile(path.join(repoRoot, '.env'), 'utf8'));
  } catch {
    // No .env file; rely on process environment only.
  }
  return { ...fileEnv, ...process.env };
}

function fail(message) {
  console.error(`\n  ✖ ${message}\n`);
  process.exit(1);
}

function parseArguments(argv) {
  const positional = [];
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--expires') {
      options.expires = argv[index + 1];
      index += 1;
    } else {
      positional.push(value);
    }
  }
  return { positional, options };
}

async function callOperatorApi(context, method, pathName, body) {
  const url = `${context.apiUrl}${pathName}`;

  let response;
  try {
    response = await fetch(url, {
      method,
      headers: {
        'content-type': 'application/json',
        'x-livara-mvp-operator-key': context.operatorKey,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    fail(
      `Could not reach the API at ${context.apiUrl}. Start it first: npm run dev:api`,
    );
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // Non-JSON response handled below.
  }

  if (!response.ok || payload?.success !== true) {
    const code = payload?.error?.code ?? `HTTP_${response.status}`;
    const message = payload?.error?.message ?? 'Unexpected API response.';
    fail(`${code}: ${message}`);
  }

  return payload.data;
}

function printAlbum(album) {
  console.log(`  Title:        ${album.title}`);
  console.log(`  Album ID:     ${album.id}`);
  console.log(`  Guest URL:    ${album.guestUrl}`);
  console.log(`  Uploads:      ${album.uploadEnabled ? 'OPEN' : 'CLOSED'}`);
  console.log(
    `  Expires:      ${album.uploadExpiresAt ?? 'no expiration'}`,
  );
  console.log(`  Created:      ${album.createdAt}`);
}

async function resolveAlbum(context, reference) {
  if (typeof reference !== 'string' || reference.trim() === '') {
    fail('Provide an album id, guest token, or unique id prefix.');
  }

  const albums = await callOperatorApi(context, 'GET', '/api/v1/mvp/operator/albums');
  const matches = albums.filter(
    (album) =>
      album.id === reference ||
      album.guestToken === reference ||
      album.id.startsWith(reference),
  );

  if (matches.length === 0) {
    fail(`No album matches "${reference}". Use: npm run mvp:album:list`);
  }
  if (matches.length > 1) {
    fail(`"${reference}" matches more than one album. Use the full album id.`);
  }
  return matches[0];
}

async function generateQr(context, album) {
  const { default: QRCode } = await import('qrcode');

  const dataDirSetting = context.env.MVP_DATA_DIR ?? 'data/mvp';
  const dataDir = path.isAbsolute(dataDirSetting)
    ? dataDirSetting
    : path.resolve(repoRoot, dataDirSetting);
  const qrDir = path.join(dataDir, 'qr');
  await fs.mkdir(qrDir, { recursive: true });

  const filePath = path.join(qrDir, `${album.id}.png`);
  await QRCode.toFile(filePath, album.guestUrl, {
    type: 'png',
    width: 800,
    margin: 2,
  });

  return filePath;
}

const HELP = `
Livara Manual MVP operator commands

  album:create "<title>" [--expires <iso-date>]   Create an album
  album:list                                      List all albums
  album:url <albumId|token|prefix>                Show the guest URL for an album
  uploads:open <albumId> [--expires <iso-date>]   Open uploads for an album
  uploads:close <albumId>                         Close uploads for an album
  media:list <albumId>                            List uploaded media
  media:delete <albumId> <mediaId>                Delete one uploaded media item
  qr <albumId|token|prefix>                       Save a QR PNG for the guest URL
  help                                            Show this help
`;

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const { positional, options } = parseArguments(rest);

  if (command === undefined || command === 'help') {
    console.log(HELP);
    return;
  }

  const env = await loadEnvironment();
  const apiPort = env.API_PORT ?? '3001';
  const context = {
    env,
    apiUrl: (env.MVP_API_URL ?? `http://localhost:${apiPort}`).replace(/\/+$/, ''),
    operatorKey: env.MVP_OPERATOR_KEY ?? '',
  };

  if (context.operatorKey === '') {
    fail(
      'MVP_OPERATOR_KEY is not set in the root .env. Generate one with:\n' +
        '    node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"',
    );
  }

  switch (command) {
    case 'album:create': {
      const title = positional[0];
      if (title === undefined || title.trim() === '') {
        fail('Usage: npm run mvp:album:create -- "Aziz & Madina" [--expires <iso>]');
      }

      const album = await callOperatorApi(
        context,
        'POST',
        '/api/v1/mvp/operator/albums',
        { title, uploadExpiresAt: options.expires },
      );

      console.log('\n  Album created\n');
      printAlbum(album);

      const qrPath = await generateQr(context, album);
      console.log(`  QR code:      ${qrPath}\n`);
      break;
    }

    case 'album:list': {
      const albums = await callOperatorApi(
        context,
        'GET',
        '/api/v1/mvp/operator/albums',
      );
      if (albums.length === 0) {
        console.log('\n  No albums yet. Create one: npm run mvp:album:create -- "Title"\n');
        break;
      }
      console.log(`\n  ${albums.length} album(s)\n`);
      for (const album of albums) {
        printAlbum(album);
        console.log('');
      }
      break;
    }

    case 'album:url': {
      const album = await resolveAlbum(context, positional[0]);
      console.log(`\n  ${album.title}`);
      console.log(`  Guest URL: ${album.guestUrl}\n`);
      break;
    }

    case 'uploads:open': {
      const album = await resolveAlbum(context, positional[0]);
      const updated = await callOperatorApi(
        context,
        'POST',
        `/api/v1/mvp/operator/albums/${album.id}/uploads/open`,
        options.expires === undefined ? {} : { uploadExpiresAt: options.expires },
      );
      console.log('\n  Uploads opened\n');
      printAlbum(updated);
      console.log('');
      break;
    }

    case 'uploads:close': {
      const album = await resolveAlbum(context, positional[0]);
      const updated = await callOperatorApi(
        context,
        'POST',
        `/api/v1/mvp/operator/albums/${album.id}/uploads/close`,
      );
      console.log('\n  Uploads closed\n');
      printAlbum(updated);
      console.log('');
      break;
    }

    case 'media:list': {
      const album = await resolveAlbum(context, positional[0]);
      const media = await callOperatorApi(
        context,
        'GET',
        `/api/v1/mvp/operator/albums/${album.id}/media`,
      );
      console.log(`\n  ${album.title} — ${media.length} uploaded item(s)\n`);
      for (const item of media) {
        console.log(`  ${item.id}`);
        console.log(`    File:     ${item.originalFilename}`);
        console.log(`    Type:     ${item.mimeType}`);
        console.log(`    Size:     ${(item.size / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`    Uploaded: ${item.createdAt}`);
        console.log(
          `    Preview:  ${context.apiUrl}/api/v1/mvp/guest/albums/${album.guestToken}/media/${item.id}/file`,
        );
        console.log('');
      }
      break;
    }

    case 'media:delete': {
      const album = await resolveAlbum(context, positional[0]);
      const mediaId = positional[1];
      if (mediaId === undefined) {
        fail('Usage: npm run mvp:media:delete -- <albumId> <mediaId>');
      }
      await callOperatorApi(
        context,
        'DELETE',
        `/api/v1/mvp/operator/albums/${album.id}/media/${mediaId}`,
      );
      console.log(`\n  Deleted media ${mediaId} from "${album.title}"\n`);
      break;
    }

    case 'qr': {
      const album = await resolveAlbum(context, positional[0]);
      const qrPath = await generateQr(context, album);
      console.log(`\n  ${album.title}`);
      console.log(`  Guest URL: ${album.guestUrl}`);
      console.log(`  QR code:   ${qrPath}\n`);
      break;
    }

    default:
      console.log(HELP);
      fail(`Unknown command "${command}".`);
  }
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
