import { uploadBufferToCloudinary } from "./upload.service.js";

export const uploadFileController = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file provided" });
    }

    const result = await uploadBufferToCloudinary(req.file);

    res.json({ success: true, message: "Uploaded", data: { url: result.secure_url } });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, message: error.message || "Upload failed" });
  }
};
