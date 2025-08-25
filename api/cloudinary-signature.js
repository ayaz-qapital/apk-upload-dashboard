const crypto = require('crypto');

// Serverless function to generate a signed Cloudinary upload payload
// We only sign parameters; the browser uploads the file directly to Cloudinary.
// Env vars required:
// - CLOUDINARY_CLOUD_NAME
// - CLOUDINARY_API_KEY
// - CLOUDINARY_API_SECRET
// Optional:
// - CLOUDINARY_FOLDER (e.g., apk-uploads)

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_FOLDER } = process.env;

  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return res.status(500).json({ error: 'Cloudinary environment variables are not configured' });
  }

  try {
    // Expect optional public_id from client to keep filename readable
    const { public_id } = req.body || {};

    const timestamp = Math.floor(Date.now() / 1000);

    // Build the params we want to sign
    const params = {
      timestamp,
      folder: CLOUDINARY_FOLDER || 'apk-uploads',
      resource_type: 'raw', // APKs are not images/videos; treat as raw files
      public_id: public_id || undefined,
    };

    // Create the string to sign (alphabetical order, exclude undefined)
    const toSign = Object.keys(params)
      .filter((k) => params[k] !== undefined && params[k] !== null && params[k] !== '')
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');

    const signature = crypto
      .createHash('sha1')
      .update(`${toSign}${CLOUDINARY_API_SECRET}`)
      .digest('hex');

    return res.status(200).json({
      cloudName: CLOUDINARY_CLOUD_NAME,
      apiKey: CLOUDINARY_API_KEY,
      timestamp,
      signature,
      folder: params.folder,
      resourceType: 'raw',
      publicId: params.public_id || null,
      uploadUrl: `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`,
    });
  } catch (err) {
    console.error('Cloudinary signature error:', err);
    return res.status(500).json({ error: 'Failed to generate Cloudinary signature' });
  }
}
