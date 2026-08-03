"use client";

import { useEffect, useState, useCallback } from "react";

export type GalleryItem = {
  id: string;
  url: string;
  createdAt: string;
};

type MediaListResponse = {
  success?: boolean;
  data?: { items?: GalleryItem[] };
};

function resolveMediaUrl(apiUrl: string, pathOrUrl: string): string {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  return `${apiUrl.replace(/\/+$/, "")}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export function AlbumGallery({
  guestToken,
  apiUrl,
  refreshToken = 0,
}: {
  guestToken: string;
  apiUrl: string;
  /** Increment after a successful upload to reload gallery items. */
  refreshToken?: number;
}) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [failedIds, setFailedIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    let cancelled = false;

    async function loadMedia(): Promise<void> {
      try {
        const response = await fetch(
          `${apiUrl}/api/v1/mvp/guest/albums/${encodeURIComponent(guestToken)}/media`,
          { cache: "no-store" },
        );

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setStatus("error");
          return;
        }

        const payload = (await response.json()) as MediaListResponse;
        const next = payload.data?.items ?? [];
        // Server list is authoritative — avoids duplicate entries after refresh.
        setItems(next);
        setFailedIds(new Set());
        setStatus("ready");
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    }

    void loadMedia();

    return () => {
      cancelled = true;
    };
  }, [apiUrl, guestToken, refreshToken]);

  const markFailed = useCallback((id: string) => {
    setFailedIds((previous) => {
      if (previous.has(id)) {
        return previous;
      }
      const next = new Set(previous);
      next.add(id);
      return next;
    });
  }, []);

  return (
    <section aria-label="Shared photos" className="flex flex-col gap-4">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-serif text-xl text-stone-800">Shared photos</h2>
        {status === "ready" && items.length > 0 && (
          <p className="text-sm text-stone-400">
            {items.length === 1 ? "1 photo" : `${items.length} photos`}
          </p>
        )}
      </div>

      {status === "loading" && items.length === 0 && (
        <div className="grid grid-cols-2 gap-2">
          <div className="aspect-[3/4] animate-pulse rounded-2xl bg-stone-200/70" />
          <div className="aspect-[4/5] animate-pulse rounded-2xl bg-stone-200/70" />
        </div>
      )}

      {status === "error" && items.length === 0 && (
        <p className="rounded-2xl border border-stone-200 bg-white px-5 py-8 text-center text-sm leading-6 text-stone-500">
          Photos could not be loaded right now. Please try again in a moment.
        </p>
      )}

      {status === "ready" && items.length === 0 && (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-5 py-10 text-center text-sm leading-6 text-stone-500">
          No photos yet — be the first to add a memory.
        </p>
      )}

      {items.length > 0 && (
        <ul className="columns-2 gap-2">
          {items.map((item) => {
            const src = resolveMediaUrl(apiUrl, item.url);
            const failed = failedIds.has(item.id);

            return (
              <li
                key={item.id}
                className="mb-2 break-inside-avoid overflow-hidden rounded-2xl bg-stone-100"
              >
                {failed ? (
                  <div className="flex aspect-[3/4] items-center justify-center px-3 text-center text-xs text-stone-400">
                    This photo could not be shown
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element -- guest media is served from the API with a tokenized path; next/image is not suitable here.
                  <img
                    src={src}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="block h-auto w-full"
                    onError={() => markFailed(item.id)}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
