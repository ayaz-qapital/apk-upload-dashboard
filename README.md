# APK Upload Dashboard (Vercel + Cloudinary + BrowserStack)

A React dashboard deployed on Vercel that uploads APKs via Cloudinary to BrowserStack and returns the `app_url` for WebdriverIO + Appium automation.

## Architecture

- **Frontend**: React (Vite) + Material UI
- **Backend**: Vercel serverless functions
- **File Storage**: Cloudinary (handles large files >50MB)
- **Upload Flow**: Client → Cloudinary → Vercel API → BrowserStack

## Deployment Setup

### 1. Cloudinary Setup
1. Create account at [cloudinary.com](https://cloudinary.com)
2. Create an upload preset named `apk_uploads`:
   - Go to Settings → Upload → Upload presets
   - Create new preset with name `apk_uploads`
   - Set resource type to `Raw`
   - Set mode to `Unsigned` or `Signed`

### 2. Environment Variables
Add these to your Vercel dashboard (Settings → Environment Variables):

```
BROWSERSTACK_USERNAME=ayazmahmood_U5cIfM
BROWSERSTACK_ACCESS_KEY=5oMaz1Dq2VCvdnnd8jY3
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
REACT_APP_CLOUDINARY_CLOUD_NAME=your_cloud_name
REACT_APP_CLOUDINARY_API_KEY=your_api_key
```

### 3. Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

## Local Development
```bash
npm install
npm run dev
```

## API Endpoints
- `POST /api/upload` — Upload APK via Cloudinary to BrowserStack
- `GET /api/history` — Get upload history
- `GET /api/history/[id]` — Get specific upload
- `POST /api/cloudinary-signature` — Generate Cloudinary signature

## Features
- ✅ Large file support (>50MB) via Cloudinary
- ✅ Drag & drop upload interface
- ✅ Real-time progress tracking
- ✅ Upload history with copy/open actions
- ✅ Serverless deployment ready
- ✅ BrowserStack integration
