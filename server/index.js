const express = require('express')
const cors = require('cors')
const multer = require('multer')
const path = require('path')
const fs = require('fs-extra')
const axios = require('axios')
const FormData = require('form-data')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { uploadToS3, deleteFromS3, getS3FileUrl } = require('./aws-config')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads')
fs.ensureDirSync(uploadsDir)

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data')
fs.ensureDirSync(dataDir)

// Use S3 upload configuration (supports up to 500MB)
const upload = uploadToS3

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

// Demo user credentials (in production, use a proper database)
const DEMO_USER = {
  username: 'admin',
  password: 'admin123' // We'll hash this in the login route
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Access token required' })
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' })
    }
    req.user = user
    next()
  })
}

// Helper function to load uploads data
const loadUploads = () => {
  const uploadsFile = path.join(dataDir, 'uploads.json')
  try {
    if (fs.existsSync(uploadsFile)) {
      return JSON.parse(fs.readFileSync(uploadsFile, 'utf8'))
    }
  } catch (error) {
    console.error('Error loading uploads:', error)
  }
  return []
}

// Helper function to save uploads data
const saveUploads = (uploads) => {
  const uploadsFile = path.join(dataDir, 'uploads.json')
  try {
    fs.writeFileSync(uploadsFile, JSON.stringify(uploads, null, 2))
  } catch (error) {
    console.error('Error saving uploads:', error)
  }
}

// BrowserStack API helper for S3 URLs
const uploadToBrowserStackFromS3 = async (s3Url, originalName) => {
  try {
    const username = process.env.BROWSERSTACK_USERNAME
    const accessKey = process.env.BROWSERSTACK_ACCESS_KEY

    if (!username || !accessKey) {
      throw new Error('BrowserStack credentials not configured')
    }

    // Download file from S3 and upload to BrowserStack
    const response = await axios.get(s3Url, { responseType: 'stream' })
    
    const form = new FormData()
    form.append('file', response.data, originalName)

    const browserStackResponse = await axios.post(
      'https://api-cloud.browserstack.com/app-automate/upload',
      form,
      {
        headers: {
          ...form.getHeaders(),
        },
        auth: {
          username: username,
          password: accessKey
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    )

    return browserStackResponse.data.app_url
  } catch (error) {
    console.error('BrowserStack upload error:', error.response?.data || error.message)
    throw new Error('Failed to upload to BrowserStack: ' + (error.response?.data?.error || error.message))
  }
}

// Routes

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body

    if (username !== DEMO_USER.username || password !== DEMO_USER.password) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { username: username },
      JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.json({
      token,
      user: { username }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Internal server error' })
  }
})

// Upload APK endpoint (now uses S3)
app.post('/api/upload', authenticateToken, upload.single('apk'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No APK file uploaded' })
    }

    const uploadId = Date.now().toString()
    const s3Key = req.file.key
    const s3Location = req.file.location
    const originalName = req.file.originalname
    const fileSize = req.file.size

    // Create upload record
    const uploadRecord = {
      id: uploadId,
      fileName: originalName,
      fileSize: `${(fileSize / (1024 * 1024)).toFixed(2)} MB`,
      status: 'processing',
      uploadDate: new Date().toISOString(),
      appUrl: null,
      s3Key: s3Key,
      s3Location: s3Location
    }

    // Save initial record
    const uploads = loadUploads()
    uploads.unshift(uploadRecord)
    saveUploads(uploads)

    // Send immediate response
    res.json(uploadRecord)

    // Upload to BrowserStack asynchronously using S3 URL
    console.log(`Starting BrowserStack upload for: ${originalName}`)
    console.log(`S3 Location: ${s3Location}`)
    
    try {
      const appUrl = await uploadToBrowserStackFromS3(s3Location, originalName)
      console.log(`BrowserStack upload successful. App URL: ${appUrl}`)
      
      // Update record with app URL
      const updatedUploads = loadUploads()
      const recordIndex = updatedUploads.findIndex(u => u.id === uploadId)
      if (recordIndex !== -1) {
        updatedUploads[recordIndex].status = 'completed'
        updatedUploads[recordIndex].appUrl = appUrl
        saveUploads(updatedUploads)
        console.log(`Updated record ${uploadId} with app URL`)
      }
    } catch (error) {
      console.error('BrowserStack upload failed:', error.message)
      console.error('Full error:', error)
      
      // Update record with error status
      const updatedUploads = loadUploads()
      const recordIndex = updatedUploads.findIndex(u => u.id === uploadId)
      if (recordIndex !== -1) {
        updatedUploads[recordIndex].status = 'failed'
        updatedUploads[recordIndex].error = error.message
        saveUploads(updatedUploads)
        console.log(`Updated record ${uploadId} with failed status`)
      }
    }
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ message: error.message || 'Upload failed' })
  }
})

// Get uploads endpoint
app.get('/api/uploads', authenticateToken, (req, res) => {
  try {
    const uploads = loadUploads()
    res.json(uploads)
  } catch (error) {
    console.error('Get uploads error:', error)
    res.status(500).json({ message: 'Failed to fetch uploads' })
  }
})

// Get single upload status endpoint
app.get('/api/uploads/:id', authenticateToken, (req, res) => {
  try {
    const uploads = loadUploads()
    const upload = uploads.find(u => u.id === req.params.id)
    if (!upload) {
      return res.status(404).json({ message: 'Upload not found' })
    }
    res.json(upload)
  } catch (error) {
    console.error('Get upload error:', error)
    res.status(500).json({ message: 'Failed to fetch upload' })
  }
})

// Delete upload endpoint (now deletes from S3 too)
app.delete('/api/uploads/:id', authenticateToken, async (req, res) => {
  try {
    const uploads = loadUploads()
    const uploadIndex = uploads.findIndex(u => u.id === req.params.id)
    
    if (uploadIndex === -1) {
      return res.status(404).json({ message: 'Upload not found' })
    }

    const deletedUpload = uploads[uploadIndex]

    // Delete from S3 if s3Key exists
    if (deletedUpload.s3Key) {
      try {
        await deleteFromS3(deletedUpload.s3Key)
        console.log(`Deleted from S3: ${deletedUpload.s3Key}`)
      } catch (s3Error) {
        console.error('Failed to delete from S3:', s3Error)
        // Continue with database deletion even if S3 deletion fails
      }
    }

    // Remove the upload from the array
    uploads.splice(uploadIndex, 1)
    saveUploads(uploads)

    console.log(`Deleted upload: ${deletedUpload.fileName} (ID: ${deletedUpload.id})`)
    res.json({ message: 'Upload deleted successfully', upload: deletedUpload })
  } catch (error) {
    console.error('Delete upload error:', error)
    res.status(500).json({ message: 'Failed to delete upload' })
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 100MB.' })
    }
  }
  
  console.error('Server error:', error)
  res.status(500).json({ message: error.message || 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
})
