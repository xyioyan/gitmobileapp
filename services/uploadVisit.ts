import { supabase } from "@/config/initSupabase";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { useAuth } from "@/provider/AuthProvider";

export async function uploadVisit({
  photoUri,
  description,
  latitude,
  longitude,
  timestamp,
  address,
  userId,
  status,
}: {
  photoUri: string;
  description: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  address: string;
  userId: string;
  status: string;
}) {
  // console.log('file at upload: ',photoUri)
  try {
    // Get base64 string of the image
    const base64 = await FileSystem.readAsStringAsync(photoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    //wen the status is approved

    if (status === "approved") {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError)
        throw new Error(`Session retrieval failed: ${sessionError.message}`);

      const role = session?.user?.id; // ✅ Correct role access
      const visitId = userId;
      userId = role ?? "defaultUserId"; // Replace "defaultUserId" with an appropriate fallback value
     

      const fileName = `${userId}/completion_photos/${visitId}_${timestamp}.jpg`;
      // or use uuid if preferred
      const contentType = "image/jpeg";
      console.log("file name after change: ", fileName);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(fileName, decode(base64), {
          contentType,
          upsert: true,
        });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("photos").getPublicUrl(fileName);
      console.log("public URL: ", publicUrl);

      // Save visit metadata
      const { error: insertError } = await supabase
        .from("visits")
        .update({
          user_id: userId,
          completion_image_url: publicUrl,
          completion_taken_at: timestamp,
          completion_address: `Address: ${address} Latitude: ${latitude} Longitude: ${longitude}`,
          completion_description: description,
          status: "completed",
        })
        .eq("id", visitId);

      if (insertError) throw new Error(`Insert failed: ${insertError.message}`);
    }
    if (status === "pending") {
      const fileName = `${userId}/${Date.now()}.jpg`; // or use uuid if preferred
      const filePath = `${userId}/completion_photos/${timestamp}.jpg`;

      const contentType = "image/jpeg";
      console.log("file name after change: ", fileName);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("photos")
        .upload(fileName, decode(base64), {
          contentType,
          upsert: true,
        });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("photos").getPublicUrl(fileName);
      console.log("public URL: ", publicUrl);

      // Save visit metadata
      const { error: insertError } = await supabase.from("visits").insert([
        {
          user_id: userId,
          description,
          image_url: publicUrl,
          latitude,
          longitude,
          picture_taken_at: timestamp,
          address,
          status: "pending",
        },
      ]);

      if (insertError) throw new Error(`Insert failed: ${insertError.message}`);
    }
    return true;
  } catch (err: any) {
    console.error("uploadVisit error:", err);
    throw err;
  }
}
