const CLOUD = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

const uploadToCloudinary = (file, resourceType, onProgress) =>
  new Promise((resolve, reject) => {
    if (!CLOUD || !PRESET) {
      reject(new Error("Cloudinary env vars not loaded. Restart the dev server after editing .env"));
      return;
    }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", PRESET);

    const xhr = new XMLHttpRequest();
    xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD}/${resourceType}/upload`);

    xhr.upload.addEventListener("progress", e => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100));
    });

    xhr.onload = () => {
      const res = JSON.parse(xhr.responseText);
      if (res.secure_url) resolve(res.secure_url);
      else reject(new Error(res.error?.message || "Upload failed"));
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(fd);
  });

export const uploadProductImage = (file, _productId, onProgress) =>
  uploadToCloudinary(file, "image", onProgress);

export const uploadProductVideo = (file, _productId, onProgress) =>
  uploadToCloudinary(file, "video", onProgress);

export const uploadReviewImage = (file, onProgress) =>
  uploadToCloudinary(file, "image", onProgress);

export const uploadReviewVideo = (file, onProgress) =>
  uploadToCloudinary(file, "video", onProgress);

export const uploadSupportAttachment = (file, onProgress) =>
  uploadToCloudinary(file, "image", onProgress);

// Cloudinary unsigned uploads can't be deleted client-side (requires API secret).
// Files are retained in your Cloudinary media library — manage deletions from the dashboard.
export const deleteFileByUrl = async (_url) => {};
