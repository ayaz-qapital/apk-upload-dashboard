import axios from 'axios';

export const api = axios.create({ baseURL: '/' });

const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'your-cloud-name'}/upload`;

export const uploadApkViaCloudinary = async (file, onProgress) => {
  // Step 1: Get signature from our API
  const timestamp = Math.round(new Date().getTime() / 1000);
  const params = {
    timestamp,
    upload_preset: 'apk_uploads', // You'll need to create this preset
    resource_type: 'raw'
  };

  const signatureRes = await api.post('/api/cloudinary-signature', {
    params_to_sign: params
  });

  // Step 2: Upload to Cloudinary
  const formData = new FormData();
  formData.append('file', file);
  formData.append('timestamp', timestamp);
  formData.append('upload_preset', 'apk_uploads');
  formData.append('resource_type', 'raw');
  formData.append('api_key', process.env.REACT_APP_CLOUDINARY_API_KEY || 'your-api-key');
  formData.append('signature', signatureRes.data.signature);

  const cloudinaryRes = await axios.post(CLOUDINARY_UPLOAD_URL, formData, {
    onUploadProgress: (e) => {
      if (e.total) {
        const progress = Math.round((e.loaded * 50) / e.total); // 50% for Cloudinary upload
        onProgress?.(progress);
      }
    }
  });

  onProgress?.(60); // Cloudinary done, starting BrowserStack

  // Step 3: Send Cloudinary URL to our API for BrowserStack upload
  const result = await api.post('/api/upload', {
    cloudinary_url: cloudinaryRes.data.secure_url,
    filename: file.name,
    file_size: file.size
  });

  onProgress?.(100); // Complete
  return result;
};

export const fetchHistory = () => api.get('/api/history');
