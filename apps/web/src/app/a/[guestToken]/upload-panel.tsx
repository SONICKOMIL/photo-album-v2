"use client";

import { useCallback, useRef, useState } from "react";

const MAX_FILES_PER_REQUEST = 10;
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

type UploadPhase = "idle" | "uploading" | "done" | "error";

type RejectedFile = {
  originalFilename: string;
  message: string;
};

type UploadResponse = {
  success?: boolean;
  data?: {
    accepted?: Array<{ mediaId?: string; originalFilename: string }>;
    rejected?: RejectedFile[];
  };
  error?: { code?: string; message?: string };
};

function formatMegabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function UploadPanel({
  guestToken,
  apiUrl,
  onUploadSuccess,
}: {
  guestToken: string;
  apiUrl: string;
  /** Called after at least one photo was accepted, so the gallery can refresh. */
  onUploadSuccess?: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [progress, setProgress] = useState(0);
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [rejectedFiles, setRejectedFiles] = useState<RejectedFile[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const onPickFiles = useCallback((fileList: FileList | null) => {
    if (fileList === null) {
      return;
    }

    const oversized: RejectedFile[] = [];
    const usable: File[] = [];

    for (const file of Array.from(fileList)) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        oversized.push({
          originalFilename: file.name,
          message: `Larger than 25 MB (${formatMegabytes(file.size)}).`,
        });
      } else {
        usable.push(file);
      }
    }

    setSelectedFiles(usable);
    setRejectedFiles(oversized);
    setAcceptedCount(0);
    setErrorMessage(null);
    setPhase("idle");
    setProgress(0);
  }, []);

  const uploadBatch = useCallback(
    (files: File[]): Promise<UploadResponse> => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        for (const file of files) {
          formData.append("files", file, file.name);
        }

        const request = new XMLHttpRequest();
        request.open(
          "POST",
          `${apiUrl}/api/v1/mvp/guest/albums/${encodeURIComponent(guestToken)}/uploads`,
        );

        request.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        };

        request.onload = () => {
          try {
            resolve(JSON.parse(request.responseText) as UploadResponse);
          } catch {
            reject(new Error("Unexpected server response."));
          }
        };
        request.onerror = () => reject(new Error("Network error."));
        request.send(formData);
      });
    },
    [apiUrl, guestToken],
  );

  const startUpload = useCallback(async () => {
    if (selectedFiles.length === 0 || phase === "uploading") {
      return;
    }

    setPhase("uploading");
    setProgress(0);
    setErrorMessage(null);

    let accepted = 0;
    const rejected: RejectedFile[] = [...rejectedFiles];

    try {
      for (
        let index = 0;
        index < selectedFiles.length;
        index += MAX_FILES_PER_REQUEST
      ) {
        const batch = selectedFiles.slice(index, index + MAX_FILES_PER_REQUEST);
        const response = await uploadBatch(batch);

        if (response.success !== true || response.data === undefined) {
          const message =
            response.error?.message ??
            "Upload was not accepted. Please try again.";
          setErrorMessage(message);
          setPhase("error");
          setAcceptedCount(accepted);
          setRejectedFiles(rejected);
          return;
        }

        accepted += response.data.accepted?.length ?? 0;
        rejected.push(...(response.data.rejected ?? []));
      }

      setAcceptedCount(accepted);
      setRejectedFiles(rejected);
      setSelectedFiles([]);
      if (inputRef.current !== null) {
        inputRef.current.value = "";
      }
      setPhase("done");
      if (accepted > 0) {
        onUploadSuccess?.();
      }
    } catch {
      setErrorMessage(
        "The upload could not be completed. Please check your connection and try again.",
      );
      setPhase("error");
    }
  }, [selectedFiles, phase, rejectedFiles, uploadBatch, onUploadSuccess]);

  const resetForMore = useCallback(() => {
    setPhase("idle");
    setAcceptedCount(0);
    setRejectedFiles([]);
    setErrorMessage(null);
    setProgress(0);
  }, []);

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      {phase === "done" ? (
        <div className="text-center">
          <p className="text-4xl">✦</p>
          <h2 className="mt-3 font-serif text-2xl text-stone-800">
            {acceptedCount === 1
              ? "Your memory has been added"
              : `${acceptedCount} memories have been added`}
          </h2>
          <p className="mt-2 text-base leading-7 text-stone-500">
            Thanks for adding to the story.
          </p>
          {rejectedFiles.length > 0 && (
            <RejectedList rejectedFiles={rejectedFiles} />
          )}
          <button
            type="button"
            onClick={resetForMore}
            className="mt-6 h-12 w-full rounded-full border border-stone-300 text-base font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            Add more memories
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <input
            ref={inputRef}
            id="mvp-photo-picker"
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={phase === "uploading"}
            onChange={(event) => onPickFiles(event.target.files)}
          />
          <label
            htmlFor="mvp-photo-picker"
            className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 px-4 py-6 text-center transition-colors hover:border-stone-400"
          >
            <span className="text-base font-medium text-stone-700">
              {selectedFiles.length > 0
                ? "Change selection"
                : "Choose your photos"}
            </span>
            <span className="text-sm text-stone-400">
              JPEG, PNG, WebP, GIF or HEIC — up to 25 MB each
            </span>
          </label>

          {selectedFiles.length > 0 && (
            <p className="text-center text-sm text-stone-500">
              {selectedFiles.length === 1
                ? "1 photo selected"
                : `${selectedFiles.length} photos selected`}
            </p>
          )}

          {phase === "uploading" && (
            <div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
                <div
                  className="h-full rounded-full bg-stone-700 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-center text-sm text-stone-500">
                Adding your memories… {progress}%
              </p>
            </div>
          )}

          {errorMessage !== null && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          {rejectedFiles.length > 0 && phase !== "uploading" && (
            <RejectedList rejectedFiles={rejectedFiles} />
          )}

          <button
            type="button"
            onClick={() => void startUpload()}
            disabled={selectedFiles.length === 0 || phase === "uploading"}
            className="h-12 w-full rounded-full bg-stone-800 text-base font-medium text-white transition-colors hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-300"
          >
            {phase === "uploading" ? "Uploading…" : "Add your memories"}
          </button>
        </div>
      )}
    </section>
  );
}

function RejectedList({ rejectedFiles }: { rejectedFiles: RejectedFile[] }) {
  return (
    <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-left">
      <p className="text-sm font-medium text-amber-800">
        {rejectedFiles.length === 1
          ? "1 file could not be added:"
          : `${rejectedFiles.length} files could not be added:`}
      </p>
      <ul className="mt-1 space-y-1">
        {rejectedFiles.map((file, index) => (
          <li
            key={`${file.originalFilename}-${index}`}
            className="text-sm text-amber-700"
          >
            <span className="font-medium">{file.originalFilename}</span> —{" "}
            {file.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
