const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

export interface CloudinaryResult {
  url: string;
  secureUrl: string;
  publicId: string;
  duration?: number;
  format: string;
  resourceType: string;
  bytes: number;
}

export function uploadToCloudinary(
  file: File,
  onProgress: (percent: number) => void,
  resourceType: 'auto' | 'image' | 'video' = 'auto'
): Promise<CloudinaryResult> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('cloud_name', CLOUD_NAME);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        if (data.error) { reject(new Error(data.error.message)); return; }
        resolve({
          url: data.secure_url,
          secureUrl: data.secure_url,
          publicId: data.public_id,
          duration: data.duration,
          format: data.format,
          resourceType: data.resource_type,
          bytes: data.bytes,
        });
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error. Check your connection.')));
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`);
    xhr.send(formData);
  });
}