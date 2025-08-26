// Debug environment variables
console.log('=== Environment Variables Debug ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_CLOUDINARY_CLOUD_NAME:', process.env.REACT_APP_CLOUDINARY_CLOUD_NAME);
console.log('REACT_APP_CLOUDINARY_API_KEY:', process.env.REACT_APP_CLOUDINARY_API_KEY);
console.log('All REACT_APP_ vars:', Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')));
console.log('===================================');
