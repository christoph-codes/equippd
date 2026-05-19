import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { storage } from "@/src/services/firebase/app";

function requireStorage() {
  if (!storage) {
    throw new Error(
      "Firebase Storage is not configured. Add EXPO_PUBLIC_FIREBASE_* values.",
    );
  }

  return storage;
}

function buildProfilePhotoPath(userId: string, fileUri: string) {
  const extensionMatch = fileUri.match(/\.([A-Za-z0-9]+)(?:\?|#|$)/);
  const extension = extensionMatch?.[1]?.toLowerCase() ?? "jpg";
  const timestamp = Date.now();
  return `users/${userId}/profile/${timestamp}.${extension}`;
}

export async function uploadProfilePhoto(userId: string, fileUri: string) {
  const storageClient = requireStorage();
  const response = await fetch(fileUri);
  const blob = await response.blob();

  const fileRef = ref(storageClient, buildProfilePhotoPath(userId, fileUri));
  await uploadBytes(fileRef, blob, {
    contentType: blob.type || "image/jpeg",
  });

  return getDownloadURL(fileRef);
}

export async function deleteFileByUrl(fileUrl: string) {
  if (!fileUrl || !storage) {
    return;
  }

  try {
    await deleteObject(ref(storage, fileUrl));
  } catch {
    // Ignore cleanup failures so account actions still complete.
  }
}
