import { supabase } from "@/lib/supabase";

const BUCKET = "property-images";

export async function uploadImage(
  folder: string,
  uri: string
): Promise<string | null> {
  try {
    const rawExt  = uri.split(".").pop()?.split("?")[0]?.toLowerCase() ?? "jpg";
    const ext      = ["jpg", "jpeg", "png", "webp"].includes(rawExt) ? rawExt : "jpg";
    const mimeType = ext === "png" ? "image/png" : "image/jpeg";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const path     = `${folder}/${filename}`;

    // React Native's FormData supports local file URIs natively.
    // The JS object with { uri, name, type } is the required shape.
    const formData = new FormData();
    formData.append("file", { uri, name: filename, type: mimeType } as any);

    // Supabase JS client's upload() can't handle RN FormData blobs,
    // so we call the Storage REST endpoint directly with a bearer token.
    const { data: { session } } = await supabase.auth.getSession();
    const token      = session?.access_token ?? process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;
    const storageUrl = `${process.env.EXPO_PUBLIC_SUPABASE_URL}/storage/v1/object/${BUCKET}/${path}`;

    const res = await fetch(storageUrl, {
      method:  "POST",
      headers: { Authorization: `Bearer ${token}` },
      // Do NOT set Content-Type manually – React Native sets it with the
      // multipart boundary automatically when the body is FormData.
      body: formData,
    });

    if (!res.ok) {
      const msg = await res.text();
      throw new Error(msg);
    }

    // Build public URL using the Supabase client helper
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path);

    return publicUrl;
  } catch (e) {
    console.error("Image upload failed:", e);
    return null;
  }
}
