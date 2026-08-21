import { supabase } from "./supabase";

// Uploads an image to the public "media" bucket and returns its public URL.
// Folder groups files (e.g. "avatars", "thumbnails"). Filenames are randomized
// so re-uploads never collide.
export async function uploadImage(file: File, folder: string): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${folder}/${crypto.randomUUID()}.${ext || "jpg"}`;
  const { error } = await supabase.storage.from("media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

// ---- Secure documents (private "secure-docs" bucket; access via short-lived signed URLs) ----
export async function uploadSecureDoc(file: File, folder: string): Promise<string> {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${folder}/${crypto.randomUUID()}.${ext || "bin"}`;
  const { error } = await supabase.storage.from("secure-docs").upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return path;
}
export async function signedDocUrl(path: string, seconds = 600): Promise<string | null> {
  const { data } = await supabase.storage.from("secure-docs").createSignedUrl(path, seconds);
  return data?.signedUrl ?? null;
}
export async function deleteSecureDoc(path: string): Promise<void> {
  await supabase.storage.from("secure-docs").remove([path]);
}

// ---- Creator documents (private "creator-docs" bucket) ----
export async function uploadCreatorDoc(file: File, creatorId: string): Promise<{ path: string; size: number; mime: string }> {
  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${creatorId}/${crypto.randomUUID()}.${ext || "bin"}`;
  const { error } = await supabase.storage.from("creator-docs").upload(path, file, {
    upsert: false,
    contentType: file.type || undefined,
  });
  if (error) throw error;
  return { path, size: file.size, mime: file.type || "" };
}
export async function signedCreatorDocUrl(path: string, seconds = 600): Promise<string | null> {
  const { data } = await supabase.storage.from("creator-docs").createSignedUrl(path, seconds);
  return data?.signedUrl ?? null;
}
