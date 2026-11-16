import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import { v2 as cloudinary } from "cloudinary";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const supabaseUrl = process.env.SUPABASE_URL || "https://otrhmajpdsfzcxbmxgle.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY;

// Supabase Storage requires a standard Compact JWS JWT (starts with eyJ...).
// New opaque keys (sb_secret_... or sb_publishable_...) cause "Invalid Compact JWS" in storage-js.
const isSupabaseJwt = typeof supabaseKey === "string" && supabaseKey.startsWith("eyJ");

const supabase = isSupabaseJwt ? createClient(supabaseUrl, supabaseKey) : null;
const BUCKET_NAME = process.env.SUPABASE_STORAGE_BUCKET || "Makeupapp";

// Configure Cloudinary
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Uploads a file buffer to Cloudinary
 */
export const uploadBufferToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured) {
      return reject(new Error("Cloudinary credentials are not configured in .env"));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: "makeup_app",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url || result.url,
          secure_url: result.secure_url || result.url,
          path: result.public_id,
        });
      }
    );

    uploadStream.end(file.buffer);
  });
};

let bucketChecked = false;
async function ensureBucketExists() {
  if (bucketChecked || !supabase) return;
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
  // If Supabase has a valid JWT key (eyJ...), try Supabase Storage
  if (supabase && isSupabaseJwt) {
    try {
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
        throw error;
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(fileName);

      return {
        secure_url: publicUrlData.publicUrl,
        url: publicUrlData.publicUrl,
        path: data?.path || fileName,
      };
    } catch (supabaseError) {
      console.warn("Supabase Storage upload failed, falling back to Cloudinary:", supabaseError.message);
      if (isCloudinaryConfigured) {
        return uploadBufferToCloudinary(file);
      }
      throw new Error(supabaseError.message || "Failed to upload file to Supabase Storage");
    }
  }

  // If Supabase key is an opaque key (like sb_secret_... which causes "Invalid Compact JWS"),
  // seamlessly upload using configured Cloudinary
  if (isCloudinaryConfigured) {
    return uploadBufferToCloudinary(file);
  }

  throw new Error("No valid storage service configured. Please provide a valid Supabase JWT or Cloudinary credentials.");
};
