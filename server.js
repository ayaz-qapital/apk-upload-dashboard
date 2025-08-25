const express = require('express');
const multer = require('multer');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const Database = require('./database');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const db = new Database();
let dbInitialized = false;

// Middleware
app.use(cors());
app.use(express.json());

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

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

// Authentication middleware
function requireAuth(req, res, next) {
  if (!dbInitialized) {
    return res.status(503).json({ error: 'Database not ready' });
  }
  
  if (req.session && req.session.authenticated) {
    return next();
  } else {
    return res.status(401).json({ error: 'Authentication required' });
  }
}

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
  if (req.session && req.session.authenticated) {
    res.redirect('/dashboard');
  } else {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  }
});

app.get('/login', (req, res) => {
  if (req.session && req.session.authenticated) {
    res.redirect('/dashboard');
  } else {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!dbInitialized) {
    return res.status(503).json({ success: false, error: 'Database not ready' });
  }
  
  try {
    const user = await db.authenticateUser(username, password);
    
    if (user) {
      req.session.authenticated = true;
      req.session.username = user.username;
      req.session.userId = user.id;
      req.session.userRole = user.role;
      res.json({ success: true, message: 'Login successful' });
    } else {
      res.status(401).json({ success: false, error: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ success: false, error: 'Could not log out' });
    } else {
      res.json({ success: true, message: 'Logged out successfully' });
    }
  });
});

app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/upload', requireAuth, upload.single('apk'), async (req, res) => {
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

app.get('/history', requireAuth, (req, res) => {
  res.json(uploadHistory);
});

app.delete('/history/:id', requireAuth, (req, res) => {
  const id = parseInt(req.params.id);
  uploadHistory = uploadHistory.filter(record => record.id !== id);
  res.json({ success: true, message: 'Record deleted' });
});

// Admin endpoint to create new users (only for admin role)
app.post('/admin/users', requireAuth, async (req, res) => {
  if (req.session.userRole !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }

  const { username, password, role = 'user' } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, error: 'Username and password are required' });
  }

  try {
    const user = await db.createUser(username, password, role);
    res.json({ 
      success: true, 
      message: 'User created successfully',
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (error) {
    console.error('Error creating user:', error);
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(409).json({ success: false, error: 'Username already exists' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to create user' });
    }
  }
});

// Admin endpoint to list all users (only for admin role)
app.get('/admin/users', requireAuth, async (req, res) => {
  if (req.session.userRole !== 'admin') {
    return res.status(403).json({ success: false, error: 'Admin access required' });
  }

  try {
    const users = await db.getAllUsers();
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// Get current user info endpoint
app.get('/user-info', requireAuth, (req, res) => {
  res.json({
    success: true,
    user: {
      id: req.session.userId,
      username: req.session.username,
      role: req.session.userRole
    }
  });
});

// Change password endpoint
app.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword, confirmPassword } = req.body;

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ 
      success: false, 
      error: 'Current password, new password, and confirmation are required' 
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ 
      success: false, 
      error: 'New password and confirmation do not match' 
    });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ 
      success: false, 
      error: 'New password must be at least 6 characters long' 
    });
  }

  try {
    await db.changePassword(req.session.userId, currentPassword, newPassword);
    res.json({ 
      success: true, 
      message: 'Password changed successfully' 
    });
  } catch (error) {
    console.error('Password change error:', error);
    if (error.message === 'Current password is incorrect') {
      res.status(400).json({ success: false, error: 'Current password is incorrect' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to change password' });
    }
  }
});

// Initialize database and start server
async function startServer() {
  try {
    await db.init();
    dbInitialized = true;
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`Dashboard server running on http://localhost:${PORT}`);
      console.log('Database: SQLite with bcrypt password hashing');
      console.log('Default users: admin/password123, user/user123');
    });
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down gracefully...');
  db.close();
  process.exit(0);
});

startServer();
