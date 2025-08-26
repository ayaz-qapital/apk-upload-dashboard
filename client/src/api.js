import axios from 'axios';

export const api = axios.create({ baseURL: '/' });

const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'your-cloud-name'}/upload`;

export const uploadApkViaCloudinary = async (file, onProgress) => {
  try {
    console.log('Starting upload for file:', file.name, 'size:', file.size);
    console.log('Environment variables:', {
      REACT_APP_CLOUDINARY_CLOUD_NAME: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME,
      REACT_APP_CLOUDINARY_API_KEY: process.env.REACT_APP_CLOUDINARY_API_KEY
    });
    
    // Step 1: Get signature from our API
    const timestamp = Math.round(new Date().getTime() / 1000);
    const params = {
      timestamp,
      resource_type: 'raw'
    };

    console.log('Requesting signature with params:', params);
    
    const signatureRes = await api.post('/api/cloudinary-signature', {
      params_to_sign: params
    });

    console.log('Signature response:', signatureRes.data);

    if (!signatureRes.data?.signature) {
      throw new Error('Failed to get Cloudinary signature');
    }

    // Check if we have the required environment variables
    const apiKey = process.env.REACT_APP_CLOUDINARY_API_KEY;
    const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
    
    if (!apiKey) {
      throw new Error('REACT_APP_CLOUDINARY_API_KEY environment variable is not set');
    }
    
    if (!cloudName) {
      throw new Error('REACT_APP_CLOUDINARY_CLOUD_NAME environment variable is not set');
    }

    // Step 2: Upload to Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('timestamp', timestamp.toString());
    formData.append('resource_type', 'raw');
    formData.append('api_key', apiKey);
    formData.append('signature', signatureRes.data.signature);

    console.log('Uploading to Cloudinary URL:', CLOUDINARY_UPLOAD_URL);
    console.log('FormData contents:', Array.from(formData.entries()));

    const cloudinaryRes = await axios.post(CLOUDINARY_UPLOAD_URL, formData, {
      onUploadProgress: (e) => {
        if (e.total && typeof onProgress === 'function') {
          const progress = Math.round((e.loaded * 50) / e.total);
          onProgress(progress);
        }
      }
    });

    console.log('Cloudinary response:', cloudinaryRes.data);

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
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error;
  }
};

export const fetchHistory = () => api.get('/api/history');
