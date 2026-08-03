"use client";

import { useCallback, useState } from "react";
import { AlbumGallery } from "./album-gallery";
import { UploadPanel } from "./upload-panel";

function ClosedUploadsMessage() {
  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-8 text-center shadow-sm">
      <h2 className="font-serif text-2xl text-stone-800">Uploads are closed</h2>
      <p className="mt-3 text-base leading-7 text-stone-500">
        This album is not accepting new memories right now. Thank you for being
        part of the celebration.
      </p>
    </div>
  );
}

export function GuestAlbumView({
  guestToken,
  apiUrl,
  uploadOpen,
}: {
  guestToken: string;
  apiUrl: string;
  uploadOpen: boolean;
}) {
  const [galleryRefreshToken, setGalleryRefreshToken] = useState(0);

  const onUploadSuccess = useCallback(() => {
    setGalleryRefreshToken((value) => value + 1);
  }, []);

  return (
    <div className="flex flex-col gap-8">
      {uploadOpen ? (
        <UploadPanel
          guestToken={guestToken}
          apiUrl={apiUrl}
          onUploadSuccess={onUploadSuccess}
        />
      ) : (
        <ClosedUploadsMessage />
      )}

      <AlbumGallery
        guestToken={guestToken}
        apiUrl={apiUrl}
        refreshToken={galleryRefreshToken}
      />
    </div>
  );
}
