# APK Upload Dashboard - BrowserStack Integration

A modern, visually appealing dashboard for uploading APK files to BrowserStack and retrieving app URLs for WebDriverIO automation testing.

## Features

- 🚀 **Modern UI**: Beautiful, responsive dashboard with gradient backgrounds and smooth animations
- 📱 **APK Upload**: Drag & drop or browse to upload APK files
- 🔗 **BrowserStack Integration**: Automatic upload to BrowserStack via API
- 📊 **Upload History**: Track all uploads with success/failure status
- 📋 **Copy App URLs**: One-click copy of BrowserStack app URLs
- 🔒 **Secure**: Password field with toggle visibility
- 📈 **Statistics**: Real-time upload statistics
- 🗑️ **Management**: Delete upload records
- 🎯 **Progress Tracking**: Visual upload progress indicator

## Prerequisites

- Node.js (v14 or higher)
- BrowserStack account with API access
- NPM or Yarn package manager

## Installation

1. **Clone or download the project**
   ```bash
   cd build-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure BrowserStack credentials**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit .env file with your BrowserStack credentials
   # Get credentials from: https://www.browserstack.com/accounts/settings
   ```
   
   Edit the `.env` file:
   ```env
   BROWSERSTACK_USERNAME=your_actual_username
   BROWSERSTACK_ACCESS_KEY=your_actual_access_key
   PORT=3000
   ```

4. **Start the server**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

5. **Open the dashboard**
   Navigate to `http://localhost:3000` in your browser

## BrowserStack Setup

1. **Get your credentials**:
   - Go to [BrowserStack Account Settings](https://www.browserstack.com/accounts/settings)
   - Copy your Username and Access Key
   - Add them to your `.env` file

2. **API Endpoint Used**:
   - `https://api-cloud.browserstack.com/app-automate/upload`

## Usage

1. **Upload APK**:
   - Drag & drop your APK file onto the upload zone, or
   - Click "Browse Files" to select your APK file
   - Maximum file size: 100MB

2. **Submit**:
   - Click "Upload to BrowserStack"
   - Monitor the progress bar
   - View results in the upload history

3. **Manage Results**:
   - Copy app URLs with one click
   - View upload statistics
   - Delete unwanted records
   - Refresh history manually

## API Endpoints

### POST `/upload`
Upload APK file to BrowserStack

**Request**:
- `multipart/form-data`
- `apk`: APK file

**Response**:
```json
{
  "success": true,
  "message": "APK uploaded successfully to BrowserStack",
  "data": {
    "id": 1629123456789,
    "fileName": "app.apk",
    "fileSize": 12345678,
    "uploadTime": "2023-08-16T10:30:00.000Z",
    "appUrl": "bs://abcd1234567890abcdef",
    "customId": "MyApp",
    "status": "success"
  }
}
```

### GET `/history`
Get upload history

**Response**:
```json
[
  {
    "id": 1629123456789,
    "fileName": "app.apk",
    "fileSize": 12345678,
    "uploadTime": "2023-08-16T10:30:00.000Z",
    "appUrl": "bs://abcd1234567890abcdef",
    "customId": "MyApp",
    "status": "success"
  }
]
```

### DELETE `/history/:id`
Delete upload record

## WebDriverIO Integration

Use the returned app URL in your WebDriverIO configuration:

```javascript
// wdio.conf.js
exports.config = {
  user: process.env.BROWSERSTACK_USERNAME,
  key: process.env.BROWSERSTACK_ACCESS_KEY,
  
  capabilities: [{
    'bstack:options': {
      'deviceName': 'Samsung Galaxy S22',
      'osVersion': '12.0',
      'app': 'bs://abcd1234567890abcdef' // Use the app URL from dashboard
    }
  }],
  
  services: ['browserstack']
};
```

## File Structure

```
build-dashboard/
├── public/
│   ├── index.html      # Main dashboard HTML
│   ├── styles.css      # Modern CSS with gradients and animations
│   └── script.js       # Frontend JavaScript functionality
├── uploads/            # Temporary APK storage (auto-created)
├── server.js           # Express server with BrowserStack integration
├── package.json        # Dependencies and scripts
└── README.md          # This file
```

## Security Notes

- Access keys are handled securely (password field)
- Uploaded APK files are deleted after BrowserStack upload
- No sensitive data is stored permanently on the server
- CORS enabled for cross-origin requests

## Troubleshooting

### Common Issues

1. **"Only APK files are allowed" error**:
   - Ensure your file has `.apk` extension
   - Check file MIME type

2. **BrowserStack upload fails**:
   - Verify your username and access key
   - Check your BrowserStack account limits
   - Ensure APK file is valid

3. **File too large**:
   - Maximum file size is 100MB
   - Compress your APK if needed

4. **Server won't start**:
   - Check if port 3000 is available
   - Run `npm install` to ensure dependencies are installed

### Error Messages

- `No APK file uploaded`: No file was selected
- `BrowserStack username and access key are required`: Missing credentials
- `BrowserStack upload failed`: API error (check credentials and file)

## Development

To modify the dashboard:

1. **Frontend changes**: Edit files in `public/` directory
2. **Backend changes**: Edit `server.js`
3. **Styling**: Modify `public/styles.css`
4. **Functionality**: Update `public/script.js`

## Dependencies

- **express**: Web server framework
- **multer**: File upload handling
- **axios**: HTTP client for BrowserStack API
- **cors**: Cross-origin resource sharing
- **path**: File path utilities
- **fs**: File system operations

## License

MIT License - feel free to use and modify as needed.

## Support

For issues related to:
- **BrowserStack API**: Check [BrowserStack Documentation](https://www.browserstack.com/docs/app-automate/api-reference/introduction)
- **WebDriverIO**: Check [WebDriverIO Documentation](https://webdriver.io/docs/gettingstarted)
- **This Dashboard**: Check the console logs and network tab for debugging
