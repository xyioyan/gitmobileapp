import { supabase } from '@/config/initSupabase';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export async function uploadVisit({
  photoUri,
  description,
  latitude,
  longitude,
  timestamp,
  address,
  userId,
}: {
  photoUri: string;
  description: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  address: string;
  userId: string;
}) {
  console.log('file at upload: ',photoUri)
  try {
    // Get base64 string of the image
    const base64 = await FileSystem.readAsStringAsync(photoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const fileName = `${userId}/${Date.now()}.jpg`; // or use uuid if preferred
    const contentType = 'image/jpeg';
    console.log('file name after change: ',fileName)

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('photos')
      .upload(fileName, decode(base64), {
        contentType,
        upsert: true,
      });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('photos').getPublicUrl(fileName);

    // Save visit metadata
    const { error: insertError } = await supabase.from('visits').insert([
      {
        user_id: userId,
        description,
        image_url: publicUrl,
        latitude,
        longitude,
        picture_taken_at: timestamp,
        address,
        status: 'pending',
      },
    ]);

    if (insertError) throw new Error(`Insert failed: ${insertError.message}`);

    return true;
  } catch (err: any) {
    console.error('uploadVisit error:', err);
    throw err;
  }
}
