const axios = require('axios');
const FormData = require('form-data');
const { addRecord } = require('./shared-storage');

// BrowserStack API configuration
const BROWSERSTACK_API_URL = 'https://api-cloud.browserstack.com/app-automate/upload';

// Upload APK to BrowserStack
async function uploadToBrowserStack(fileBuffer, filename) {
  const BROWSERSTACK_USERNAME = process.env.BROWSERSTACK_USERNAME;
  const BROWSERSTACK_ACCESS_KEY = process.env.BROWSERSTACK_ACCESS_KEY;

  if (!BROWSERSTACK_USERNAME || !BROWSERSTACK_ACCESS_KEY) {
    throw new Error('BrowserStack credentials not configured. Please set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY environment variables.');
  }

  try {
    const form = new FormData();
    form.append('file', fileBuffer, filename);
    
    const response = await axios.post(BROWSERSTACK_API_URL, form, {
      headers: {
        ...form.getHeaders(),
      },
      auth: {
        username: BROWSERSTACK_USERNAME,
        password: BROWSERSTACK_ACCESS_KEY
      }
    });
    
    return response.data;
  } catch (error) {
    throw new Error(`BrowserStack upload failed: ${error.response?.data?.error || error.message}`);
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Simple test response first
    return res.json({
      success: false,
      error: 'Upload functionality temporarily disabled for debugging. API endpoint is working.'
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
