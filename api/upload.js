const axios = require('axios');
const multer = require('multer');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configure multer for serverless environment
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/vnd.android.package-archive' || 
        file.originalname.endsWith('.apk')) {
      cb(null, true);
    } else {
      cb(new Error('Only APK files are allowed!'), false);
    }
  },
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

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
    
    const response = await axios.post('https://api-cloud.browserstack.com/app-automate/upload', form, {
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
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    // Use multer middleware
    upload.single('apk')(req, res, async (err) => {
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({ success: false, error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, error: 'No APK file uploaded' });
      }

      try {
        // Upload to BrowserStack using file buffer
        const browserStackResponse = await uploadToBrowserStack(req.file.buffer, req.file.originalname);
        
        const uploadRecord = {
          id: Date.now(),
          fileName: req.file.originalname,
          fileSize: req.file.size,
          uploadTime: new Date().toISOString(),
          appUrl: browserStackResponse.app_url,
          customId: browserStackResponse.custom_id || null,
          status: 'success'
        };
        
        res.json({
          success: true,
          message: 'APK uploaded successfully to BrowserStack',
          data: uploadRecord
        });
        
      } catch (uploadError) {
        console.error('Upload error:', uploadError);
        
        const errorRecord = {
          id: Date.now(),
          fileName: req.file.originalname,
          fileSize: req.file.size,
          uploadTime: new Date().toISOString(),
          appUrl: null,
          customId: null,
          status: 'error',
          error: uploadError.message
        };
        
        res.status(500).json({
          success: false,
          error: uploadError.message,
          data: errorRecord
        });
      }
    });
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
