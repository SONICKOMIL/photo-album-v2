import type { Metadata } from "next";
import { GuestAlbumView } from "./guest-album-view";

// Guest albums are unlisted: discourage search engine indexing (PRD §32).
export const metadata: Metadata = {
  title: "Livara — Shared memories",
  description: "Relive the event through every guest's eyes.",
  robots: { index: false, follow: false },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

type GuestAlbum = {
  title: string;
  uploadOpen: boolean;
  uploadExpiresAt: string | null;
};

type AlbumLookup =
  | { state: "found"; album: GuestAlbum }
  | { state: "not-found" }
  | { state: "unavailable" };

async function fetchGuestAlbum(guestToken: string): Promise<AlbumLookup> {
  try {
    const response = await fetch(
      `${API_URL}/api/v1/mvp/guest/albums/${encodeURIComponent(guestToken)}`,
      { cache: "no-store" },
    );

    if (response.status === 404) {
      return { state: "not-found" };
    }
    if (!response.ok) {
      return { state: "unavailable" };
    }

    const payload = (await response.json()) as { data?: GuestAlbum };
    if (payload.data === undefined) {
      return { state: "unavailable" };
    }
    return { state: "found", album: payload.data };
  } catch {
    return { state: "unavailable" };
  }
}

function Wordmark() {
  return (
    <p className="text-center text-sm font-medium uppercase tracking-[0.35em] text-stone-400">
      Livara
    </p>
  );
}

function MessageCard({
  heading,
  message,
}: {
  heading: string;
  message: string;
}) {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
      <h1 className="font-serif text-2xl text-stone-800">{heading}</h1>
      <p className="mt-3 text-base leading-7 text-stone-500">{message}</p>
    </div>
  );
}

export default async function GuestAlbumPage({
  params,
}: {
  params: Promise<{ guestToken: string }>;
}) {
  const { guestToken } = await params;
  const lookup = await fetchGuestAlbum(guestToken);

  return (
    <div className="flex flex-1 flex-col bg-[#faf8f4]">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-5 py-10">
        <Wordmark />

        {lookup.state === "not-found" && (
          <MessageCard
            heading="This album could not be found"
            message="Please check the link or QR code you received, or ask your host for a new one."
          />
        )}

        {lookup.state === "unavailable" && (
          <MessageCard
            heading="We can't reach this album right now"
            message="Something went wrong on our side. Please try again in a moment."
          />
        )}

        {lookup.state === "found" && (
          <>
            <header className="text-center">
              <h1 className="font-serif text-3xl leading-snug text-stone-800">
                {lookup.album.title}
              </h1>
              <p className="mt-3 text-base leading-7 text-stone-500">
                See the celebration through everyone&apos;s eyes. Add the
                moments you captured — they become part of the shared story.
              </p>
            </header>

            <GuestAlbumView
              guestToken={guestToken}
              apiUrl={API_URL}
              uploadOpen={lookup.album.uploadOpen}
            />
          </>
        )}

        <footer className="mt-auto pt-8 text-center text-xs text-stone-400">
          Every guest becomes a storyteller.
        </footer>
      </main>
    </div>
  );
}
