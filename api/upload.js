import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs-extra';
import path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const DATA_DIR = '/tmp';
const DB_FILE = path.join(DATA_DIR, 'uploads.json');

const readHistory = async () => {
  try {
    if (await fs.pathExists(DB_FILE)) {
      return await fs.readJson(DB_FILE);
    }
    return [];
  } catch {
    return [];
  }
};

const writeHistory = async (data) => {
  try {
    await fs.ensureDir(DATA_DIR);
    await fs.writeJson(DB_FILE, data, { spaces: 2 });
  } catch (err) {
    console.error('Error writing history:', err);
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { cloudinary_url, filename, file_size } = req.body;

    if (!cloudinary_url || !filename) {
      return res.status(400).json({ error: 'Missing cloudinary_url or filename' });
    }

    // Validate APK
    if (!filename.toLowerCase().endsWith('.apk')) {
      return res.status(400).json({ error: 'Only .apk files are supported' });
    }

    // Check BrowserStack credentials
    const username = process.env.BROWSERSTACK_USERNAME;
    const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
    if (!username || !accessKey) {
      return res.status(500).json({ error: 'BrowserStack credentials not configured' });
    }

    // Download file from Cloudinary
    const fileResponse = await axios.get(cloudinary_url, {
      responseType: 'arraybuffer',
      timeout: 60000
    });

    // Upload to BrowserStack
    const form = new FormData();
    form.append('file', Buffer.from(fileResponse.data), { filename });

    const bsResponse = await axios.post(
      'https://api-cloud.browserstack.com/app-automate/upload',
      form,
      {
        auth: { username, password: accessKey },
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 120000
      }
    );

    const { app_url, app_id, shareable_id } = bsResponse.data || {};
    if (!app_url) {
      return res.status(502).json({ 
        error: 'Unexpected BrowserStack response', 
        details: bsResponse.data 
      });
    }

    // Save to history
    const record = {
      id: uuidv4(),
      fileName: filename,
      size: file_size || fileResponse.data.byteLength,
      createdAt: new Date().toISOString(),
      app_url,
      app_id: app_id || null,
      shareable_id: shareable_id || null,
      cloudinary_url
    };

    const items = await readHistory();
    items.push(record);
    await writeHistory(items);

    res.json(record);
  } catch (err) {
    console.error('Upload error:', err?.response?.data || err);
    res.status(500).json({
      error: 'Upload failed',
      details: err?.response?.data || err?.message || 'Unknown error'
    });
  }
}
