const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage: storage,
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

// Store upload history
let uploadHistory = [];

// BrowserStack API configuration
const BROWSERSTACK_API_URL = 'https://api-cloud.browserstack.com/app-automate/upload';
const BROWSERSTACK_USERNAME = process.env.BROWSERSTACK_USERNAME;
const BROWSERSTACK_ACCESS_KEY = process.env.BROWSERSTACK_ACCESS_KEY;

// Upload APK to BrowserStack
async function uploadToBrowserStack(filePath) {
  if (!BROWSERSTACK_USERNAME || !BROWSERSTACK_ACCESS_KEY) {
    throw new Error('BrowserStack credentials not configured. Please set BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY environment variables.');
  }

  try {
    const FormData = require('form-data');
    const form = new FormData();
    
    form.append('file', fs.createReadStream(filePath));
    
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

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/upload', upload.single('apk'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No APK file uploaded' });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    
    // Upload to BrowserStack
    const browserStackResponse = await uploadToBrowserStack(filePath);
    
    const uploadRecord = {
      id: Date.now(),
      fileName: fileName,
      fileSize: req.file.size,
      uploadTime: new Date().toISOString(),
      appUrl: browserStackResponse.app_url,
      customId: browserStackResponse.custom_id || null,
      status: 'success'
    };
    
    uploadHistory.unshift(uploadRecord);
    
    // Clean up local file
    fs.unlinkSync(filePath);
    
    res.json({
      success: true,
      message: 'APK uploaded successfully to BrowserStack',
      data: uploadRecord
    });
    
  } catch (error) {
    console.error('Upload error:', error);
    
    const errorRecord = {
      id: Date.now(),
      fileName: req.file?.originalname || 'Unknown',
      fileSize: req.file?.size || 0,
      uploadTime: new Date().toISOString(),
      appUrl: null,
      customId: null,
      status: 'error',
      error: error.message
    };
    
    uploadHistory.unshift(errorRecord);
    
    // Clean up local file if it exists
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/history', (req, res) => {
  res.json(uploadHistory);
});

app.delete('/history/:id', (req, res) => {
  const id = parseInt(req.params.id);
  uploadHistory = uploadHistory.filter(record => record.id !== id);
  res.json({ success: true, message: 'Record deleted' });
});

app.listen(PORT, () => {
  console.log(`Dashboard server running on http://localhost:${PORT}`);
});
