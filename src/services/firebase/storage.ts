import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { storage } from "@/src/services/firebase/app";

const STORAGE_TIMEOUT_MS = 15000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(
        new Error(
          "Storage request timed out. Check your network or Firebase emulator settings.",
        ),
      );
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timeoutId);
        resolve(value);
      })
      .catch((error: unknown) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

function requireStorage() {
  if (!storage) {
    throw new Error(
      "Firebase Storage is not configured. Add EXPO_PUBLIC_FIREBASE_* values.",
    );
  }

  return storage;
}

function extensionFromMimeType(mimeType?: string) {
  if (!mimeType) {
    return null;
  }

  if (mimeType === "image/jpeg") {
    return "jpg";
  }

  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  if (mimeType === "image/heic") {
    return "heic";
  }

  if (mimeType === "image/heif") {
    return "heif";
  }

  return null;
}

function extensionFromPath(value?: string) {
  if (!value) {
    return null;
  }

  const extensionMatch = value.match(/\.([A-Za-z0-9]+)(?:\?|#|$)/);
  return extensionMatch?.[1]?.toLowerCase() ?? null;
}

function buildProfilePhotoPath(
  userId: string,
  fileUri: string,
  fileName?: string,
  mimeType?: string,
) {
  const extension =
    extensionFromMimeType(mimeType) ??
    extensionFromPath(fileName) ??
    extensionFromPath(fileUri) ??
    "jpg";
  const timestamp = Date.now();
  return `users/${userId}/profile/${timestamp}.${extension}`;
}

function blobFromLocalUri(fileUri: string) {
  return new Promise<Blob>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = "blob";
    xhr.timeout = STORAGE_TIMEOUT_MS;
    xhr.onload = () => {
      resolve(xhr.response as Blob);
    };
    xhr.onerror = () => {
      reject(new Error("Could not read selected image from device storage."));
    };
    xhr.ontimeout = () => {
      reject(
        new Error(
          "Reading the selected image timed out. Please try another image.",
        ),
      );
    };
    xhr.open("GET", fileUri, true);
    xhr.send();
  });
}

export async function uploadProfilePhoto(
  userId: string,
  fileUri: string,
  options?: {
    fileName?: string;
    mimeType?: string;
  },
) {
  const storageClient = requireStorage();
  const blob = await withTimeout(blobFromLocalUri(fileUri), STORAGE_TIMEOUT_MS);
  const contentType = options?.mimeType || blob.type || "image/jpeg";

  const fileRef = ref(
    storageClient,
    buildProfilePhotoPath(userId, fileUri, options?.fileName, options?.mimeType),
  );
  await withTimeout(
    uploadBytes(fileRef, blob, {
      contentType,
    }),
    STORAGE_TIMEOUT_MS,
  );

  return withTimeout(getDownloadURL(fileRef), STORAGE_TIMEOUT_MS);
}

export async function deleteFileByUrl(fileUrl: string) {
  if (!fileUrl || !storage) {
    return;
  }

  try {
    await withTimeout(deleteObject(ref(storage, fileUrl)), STORAGE_TIMEOUT_MS);
  } catch {
    // Ignore cleanup failures so account actions still complete.
  }
}
