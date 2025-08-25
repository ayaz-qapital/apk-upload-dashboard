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

// Parse multipart form data using built-in approach
function parseMultipartData(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    
    req.on('data', chunk => {
      chunks.push(chunk);
    });
    
    req.on('end', () => {
      try {
        const buffer = Buffer.concat(chunks);
        const boundary = req.headers['content-type'].split('boundary=')[1];
        
        if (!boundary) {
          return reject(new Error('No boundary found'));
        }
        
        const parts = buffer.toString('binary').split(`--${boundary}`);
        const files = [];
        
        for (const part of parts) {
          if (part.includes('Content-Disposition: form-data') && part.includes('filename=')) {
            const lines = part.split('\r\n');
            let filename = null;
            let dataStartIndex = -1;
            
            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              if (line.includes('filename=')) {
                const match = line.match(/filename="([^"]+)"/);
                if (match) filename = match[1];
              }
              if (line === '' && dataStartIndex === -1) {
                dataStartIndex = i + 1;
                break;
              }
            }
            
            if (filename && dataStartIndex > -1) {
              const fileData = lines.slice(dataStartIndex, -1).join('\r\n');
              files.push({
                filename,
                data: Buffer.from(fileData, 'binary')
              });
            }
          }
        }
        
        resolve(files);
      } catch (error) {
        reject(error);
      }
    });
    
    req.on('error', reject);
  });
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
    const contentType = req.headers['content-type'];
    
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Content-Type must be multipart/form-data' });
    }

    // Parse multipart data
    const files = await parseMultipartData(req);
    
    if (files.length === 0) {
      return res.status(400).json({ error: 'No APK file uploaded' });
    }

    const file = files[0];
    
    // Validate APK file
    if (!file.filename.endsWith('.apk')) {
      return res.status(400).json({ error: 'Only APK files are allowed!' });
    }

    // Check file size (100MB limit)
    if (file.data.length > 100 * 1024 * 1024) {
      return res.status(400).json({ error: 'File size exceeds 100MB limit' });
    }

    // Upload to BrowserStack
    const browserStackResponse = await uploadToBrowserStack(file.data, file.filename);
    
    const uploadRecord = {
      id: Date.now(),
      fileName: file.filename,
      fileSize: file.data.length,
      uploadTime: new Date().toISOString(),
      appUrl: browserStackResponse.app_url,
      customId: browserStackResponse.custom_id || null,
      status: 'success'
    };
    
    // Add to history
    addRecord(uploadRecord);
    
    res.json({
      success: true,
      message: 'APK uploaded successfully to BrowserStack',
      data: uploadRecord
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    
    const errorRecord = {
      id: Date.now(),
      fileName: 'Unknown',
      fileSize: 0,
      uploadTime: new Date().toISOString(),
      appUrl: null,
      customId: null,
      status: 'error',
      error: error.message
    };
    
    // Add error to history
    addRecord(errorRecord);
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
