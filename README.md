# APK Upload Dashboard

A modern React-based dashboard for uploading APK files to BrowserStack and managing app URLs for WebDriverIO automation testing.

## Features

- 🔐 **Authentication System** - Secure login with JWT tokens
- 📱 **APK Upload** - Drag & drop or browse to upload APK files
- 🌐 **BrowserStack Integration** - Automatic upload to BrowserStack API
- 📊 **Dashboard Analytics** - View upload statistics and history
- 🔗 **App URL Management** - Copy and manage BrowserStack app URLs
- 🎨 **Modern UI** - Beautiful, responsive design with animations

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express, Multer, JWT
- **Integration**: BrowserStack API, Axios

## Quick Start

### Prerequisites

- Node.js 16+ installed
- BrowserStack account with API credentials

### Installation

1. **Install dependencies for all packages:**
   ```bash
   npm run install-all
   ```

2. **Configure environment variables:**
   
   Update `server/.env` with your BrowserStack credentials:
   ```env
   BROWSERSTACK_USERNAME=your_username
   BROWSERSTACK_ACCESS_KEY=your_access_key
   JWT_SECRET=your-secret-key
   ```

3. **Start the development servers:**
   ```bash
   npm run dev
   ```

   This will start:
   - Client (React) on http://localhost:5173
   - Server (Express) on http://localhost:3001

### Demo Credentials

- **Username**: `admin`
- **Password**: `admin123`

## Usage

1. **Login** with the demo credentials
2. **Upload APK** by clicking "Upload New APK" button
3. **Drag & drop** or browse to select your APK file
4. **Monitor progress** in the dashboard
5. **Copy app URLs** once processing is complete

## API Endpoints

- `POST /api/auth/login` - User authentication
- `POST /api/upload` - Upload APK file to BrowserStack
- `GET /api/uploads` - Fetch upload history
- `GET /api/health` - Health check

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── contexts/       # React contexts
│   │   └── ...
├── server/                 # Express backend
│   ├── data/              # JSON data storage
│   ├── uploads/           # Temporary file storage
│   └── index.js           # Server entry point
└── package.json           # Root package configuration
```

## Development

### Available Scripts

- `npm run dev` - Start both client and server in development mode
- `npm run client` - Start only the React client
- `npm run server` - Start only the Express server
- `npm run build` - Build the client for production
- `npm run install-all` - Install dependencies for all packages

### Environment Variables

**Server (.env)**:
- `PORT` - Server port (default: 3001)
- `JWT_SECRET` - JWT signing secret
- `BROWSERSTACK_USERNAME` - Your BrowserStack username
- `BROWSERSTACK_ACCESS_KEY` - Your BrowserStack access key

## Deployment

The application is configured for deployment on platforms like Vercel, Netlify, or Heroku. Make sure to:

1. Set environment variables in your deployment platform
2. Build the client application
3. Configure the server to serve static files in production

## Security Notes

- Change the default JWT secret in production
- Use environment variables for all sensitive data
- Implement rate limiting for production use
- Consider using a proper database instead of JSON files

## WebDriverIO Integration

Use the app URLs from this dashboard in your WebDriverIO tests:

```javascript
const capabilities = {
  'bstack:options': {
    userName: 'your_username',
    accessKey: 'your_access_key',
  },
  app: 'bs://app_url_from_dashboard', // Use the URL from dashboard
  deviceName: 'Samsung Galaxy S21',
  platformName: 'Android'
}
```

## Support

For issues or questions, please check the BrowserStack documentation or create an issue in the repository.
