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
    const { params_to_sign } = req.body;
    
    if (!params_to_sign) {
      return res.status(400).json({ error: 'Missing params_to_sign' });
    }

    const signature = cloudinary.utils.api_sign_request(
      params_to_sign,
      process.env.CLOUDINARY_API_SECRET
    );

    res.json({ signature });
  } catch (err) {
    console.error('Signature error:', err);
    res.status(500).json({ error: 'Failed to generate signature' });
  }
}
