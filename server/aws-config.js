const AWS = require('aws-sdk')
const multer = require('multer')
const multerS3 = require('multer-s3')

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1'
})

const s3 = new AWS.S3()

// Configure multer for S3 upload
const uploadToS3 = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME,
    key: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      cb(null, 'apk-files/' + uniqueSuffix + '-' + file.originalname)
    },
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: function (req, file, cb) {
      cb(null, {
        fieldName: file.fieldname,
        originalName: file.originalname,
        uploadDate: new Date().toISOString()
      })
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.originalname.toLowerCase().endsWith('.apk')) {
      cb(null, true)
    } else {
      cb(new Error('Only APK files are allowed'))
    }
  },
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  }
})

// Helper function to delete file from S3
const deleteFromS3 = async (fileKey) => {
  try {
    await s3.deleteObject({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileKey
    }).promise()
    console.log(`Deleted file from S3: ${fileKey}`)
  } catch (error) {
    console.error('Error deleting from S3:', error)
    throw error
  }
}

// Helper function to get file URL from S3
const getS3FileUrl = (fileKey) => {
  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileKey}`
}

module.exports = {
  s3,
  uploadToS3,
  deleteFromS3,
  getS3FileUrl
}
