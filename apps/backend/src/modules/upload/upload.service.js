import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://otrhmajpdsfzcxbmxgle.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || "Makeupapp";

let bucketChecked = false;
async function ensureBucketExists() {
  if (bucketChecked) return;
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets && buckets.some((b) => b.name === BUCKET_NAME);
    if (!exists) {
      await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
      });
    }
    bucketChecked = true;
  } catch (err) {
    bucketChecked = true;
  }
}

export const uploadBufferToSupabase = async (file) => {
  await ensureBucketExists();

  const fileExt = file.originalname ? file.originalname.split(".").pop() : "jpg";
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype || "image/jpeg",
      upsert: true,
    });

  if (error) {
    console.error("Supabase Storage upload error:", error);
    throw new Error(error.message || "Failed to upload file to Supabase Storage");
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return {
    secure_url: publicUrlData.publicUrl,
    url: publicUrlData.publicUrl,
    path: data?.path || fileName,
  };
};

// Backward-compatibility alias
export const uploadBufferToCloudinary = uploadBufferToSupabase;

