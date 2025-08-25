# Vercel Deployment Guide

## Prerequisites
- Node.js installed
- Vercel account (free at https://vercel.com)
- BrowserStack account with API credentials

## Quick Deployment Steps

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Prepare for Deployment
Replace your current `package.json` with the Vercel version:
```bash
cp package-vercel.json package.json
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Login to Vercel
```bash
vercel login
```

### 5. Deploy
```bash
vercel --prod
```

## Environment Variables Setup

After deployment, set these environment variables in your Vercel dashboard:

1. Go to your project dashboard on Vercel
2. Navigate to Settings → Environment Variables
3. Add the following variables:

```
BROWSERSTACK_USERNAME=your_browserstack_username
BROWSERSTACK_ACCESS_KEY=your_browserstack_access_key
```

## Project Structure for Vercel

```
build-dashboard/
├── api/
│   ├── upload.js          # Handles APK uploads
│   └── history.js         # Manages upload history
├── public/
│   ├── index.html         # Frontend
│   ├── script.js          # Frontend logic
│   └── styles.css         # Styling
├── vercel.json            # Vercel configuration
├── package.json           # Dependencies (use package-vercel.json)
└── .env                   # Local environment variables
```

## API Endpoints

After deployment, your API endpoints will be:
- `POST /api/upload` - Upload APK files
- `GET /api/history` - Get upload history
- `DELETE /api/history?id=<id>` - Delete history record

## Local Development

To test locally with Vercel:
```bash
vercel dev
```

This will start a local development server that mimics the Vercel environment.

## Important Notes

1. **File Storage**: Vercel functions are stateless, so upload history resets on each deployment
2. **File Size Limit**: 100MB APK file limit (Vercel function limit)
3. **Function Timeout**: 30 seconds maximum execution time
4. **CORS**: Already configured for cross-origin requests

## Troubleshooting

### Common Issues:
1. **Environment Variables**: Make sure they're set in Vercel dashboard, not just locally
2. **File Upload**: Ensure your frontend sends `multipart/form-data`
3. **API Routes**: All API calls should go to `/api/` endpoints

### Testing Deployment:
1. Visit your deployed URL
2. Try uploading a small APK file
3. Check the browser console for any errors
4. Verify BrowserStack credentials are working

## Frontend Updates Required

Make sure your frontend JavaScript calls the correct API endpoints:
- Change `/upload` to `/api/upload`
- Change `/history` to `/api/history`

Your dashboard is now ready for Vercel deployment!
