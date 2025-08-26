const axios = require('axios');

// Upload to BrowserStack using a public URL (Cloudinary secure_url)
// Expects JSON body: { url: 'https://res.cloudinary.com/...', fileName?, fileSize?, customId? }
// Env vars required: BROWSERSTACK_USERNAME, BROWSERSTACK_ACCESS_KEY

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { BROWSERSTACK_USERNAME, BROWSERSTACK_ACCESS_KEY } = process.env;
  if (!BROWSERSTACK_USERNAME || !BROWSERSTACK_ACCESS_KEY) {
    return res.status(500).json({ error: 'BrowserStack credentials are not configured' });
  }

  try {
    const { url, customId } = req.body || {};

    if (!url) {
      return res.status(400).json({ error: 'Missing required field: url' });
    }

    // BrowserStack upload via public URL
    const form = new URLSearchParams();
    form.append('url', url);
    if (customId) form.append('custom_id', String(customId));

    const bsResp = await axios.post(
      'https://api-cloud.browserstack.com/app-automate/upload',
      form,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        auth: {
          username: BROWSERSTACK_USERNAME,
          password: BROWSERSTACK_ACCESS_KEY,
        },
        timeout: 120000,
      }
    );

    const data = bsResp.data || {};

    const uploadRecord = {
      id: Date.now(),
      fileName: req.body.fileName || 'app.apk',
      fileSize: req.body.fileSize || 0,
      uploadTime: new Date().toISOString(),
      appUrl: data.app_url || null,
      customId: data.custom_id || null,
      status: 'success'
    };

    // Save to history (call our history API)
    try {
      await axios.post(`${req.headers.origin || 'https://' + req.headers.host}/api/history`, uploadRecord);
    } catch (historyErr) {
      console.warn('Failed to save to history:', historyErr.message);
    }

    return res.status(200).json({
      success: true,
      message: 'APK uploaded successfully to BrowserStack',
      data: uploadRecord,
    });
  } catch (err) {
    const detail = err.response?.data?.error || err.response?.data || err.message;
    console.error('BrowserStack upload error:', detail);
    return res.status(500).json({ success: false, error: `BrowserStack upload failed: ${detail}` });
  }
}
