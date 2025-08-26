import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('Cloudinary signature request body:', req.body);
    console.log('Environment variables check:', {
      cloud_name: !!process.env.CLOUDINARY_CLOUD_NAME,
      api_key: !!process.env.CLOUDINARY_API_KEY,
      api_secret: !!process.env.CLOUDINARY_API_SECRET
    });

    const { params_to_sign } = req.body;
    
    if (!params_to_sign) {
      console.error('Missing params_to_sign in request');
      return res.status(400).json({ error: 'Missing params_to_sign' });
    }

    if (!process.env.CLOUDINARY_API_SECRET) {
      console.error('Missing CLOUDINARY_API_SECRET environment variable');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    console.log('Generating signature for params:', params_to_sign);

    const signature = cloudinary.utils.api_sign_request(
      params_to_sign,
      process.env.CLOUDINARY_API_SECRET
    );

    console.log('Generated signature:', signature);
    res.json({ signature });
  } catch (err) {
    console.error('Signature error:', err);
    res.status(500).json({ error: 'Failed to generate signature', details: err.message });
  }
}
