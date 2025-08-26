import axios from 'axios';

export const api = axios.create({ baseURL: '/' });

const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'your-cloud-name'}/upload`;

export const uploadApkViaCloudinary = async (file, onProgress) => {
  try {
    // Step 1: Get signature from our API
    const timestamp = Math.round(new Date().getTime() / 1000);
    const params = {
      timestamp,
      upload_preset: 'apk_uploads',
      resource_type: 'raw'
    };

    const signatureRes = await api.post('/api/cloudinary-signature', {
      params_to_sign: params
    });

    if (!signatureRes.data?.signature) {
      throw new Error('Failed to get Cloudinary signature');
    }

    // Step 2: Upload to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('timestamp', timestamp.toString());
    formData.append('upload_preset', 'apk_uploads');
    formData.append('resource_type', 'raw');
    formData.append('api_key', process.env.REACT_APP_CLOUDINARY_API_KEY || '');
    formData.append('signature', signatureRes.data.signature);

    const cloudinaryRes = await axios.post(CLOUDINARY_UPLOAD_URL, formData, {
      onUploadProgress: (e) => {
        if (e.total && typeof onProgress === 'function') {
          const progress = Math.round((e.loaded * 50) / e.total);
          onProgress(progress);
        }
      }
    });

    if (!cloudinaryRes.data?.secure_url) {
      throw new Error('Cloudinary upload failed - no secure URL returned');
    }

    if (typeof onProgress === 'function') {
      onProgress(60);
    }

    // Step 3: Send Cloudinary URL to our API for BrowserStack upload
    const result = await api.post('/api/upload', {
      cloudinary_url: cloudinaryRes.data.secure_url,
      filename: file.name,
      file_size: file.size
    });

    if (typeof onProgress === 'function') {
      onProgress(100);
    }

    return result;
  } catch (error) {
    console.error('Upload error:', error);
    throw error;
  }
};

export const fetchHistory = () => api.get('/api/history');
