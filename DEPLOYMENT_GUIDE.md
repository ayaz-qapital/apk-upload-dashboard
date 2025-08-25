# Vercel Deployment Guide for APK Upload Dashboard

This guide will help you deploy your APK Upload Dashboard to Vercel with serverless architecture.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install globally with `npm install -g vercel`
3. **BrowserStack Account**: Get your credentials from [BrowserStack](https://www.browserstack.com)

## Environment Variables

You need to set up the following environment variables in Vercel:

### Required Environment Variables:
- `BROWSERSTACK_USERNAME`: Your BrowserStack username
- `BROWSERSTACK_ACCESS_KEY`: Your BrowserStack access key
- `SESSION_SECRET`: A secure random string for session management (generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)

### Optional Environment Variables:
- `NODE_ENV`: Set to `production` (automatically set by Vercel)

## Deployment Steps

### Method 1: Deploy via Vercel CLI (Recommended)

1. **Login to Vercel**:
   ```bash
   vercel login
   ```

2. **Navigate to your project directory**:
   ```bash
   cd c:\Users\codea\Downloads\build-dashboard
   ```

3. **Deploy to Vercel**:
   ```bash
   vercel
   ```
   - Follow the prompts to configure your project
   - Choose "Yes" when asked to link to existing project or create new one
   - Select your preferred settings

4. **Set Environment Variables**:
   ```bash
   vercel env add BROWSERSTACK_USERNAME
   vercel env add BROWSERSTACK_ACCESS_KEY
   vercel env add SESSION_SECRET
   ```
   Enter the values when prompted.

5. **Deploy with environment variables**:
   ```bash
   vercel --prod
   ```

### Method 2: Deploy via Vercel Dashboard

1. **Connect Repository**:
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository or upload project files

2. **Configure Build Settings**:
   - Framework Preset: Other
   - Build Command: (leave empty)
   - Output Directory: `public`
   - Install Command: `npm install`

3. **Set Environment Variables**:
   - Go to Project Settings → Environment Variables
   - Add the required environment variables listed above

4. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete

## Project Structure for Vercel

Your project now includes:

```
build-dashboard/
├── api/                    # Serverless functions
│   ├── auth.js            # Authentication endpoints
│   ├── upload.js          # File upload to BrowserStack
│   ├── password.js        # Password management
│   └── admin.js           # Admin user management
├── public/                # Static files
│   ├── index.html         # Main dashboard
│   ├── login.html         # Login page
│   ├── script.js          # Frontend JavaScript
│   ├── login.js           # Login functionality
│   └── styles.css         # Styles
├── database-serverless.js # Database for serverless environment
├── vercel.json           # Vercel configuration
└── package.json          # Dependencies
```

## API Endpoints (Serverless)

After deployment, your API endpoints will be available at:

- `POST /api/auth?action=login` - User authentication
- `POST /api/auth?action=logout` - User logout
- `POST /api/upload` - Upload APK to BrowserStack
- `POST /api/password?action=change` - Change password
- `POST /api/admin?action=create-user` - Create new user (admin only)
- `GET /api/admin?action=users` - List all users (admin only)

## Default Users

The system automatically creates default users:
- **Admin**: username: `admin`, password: `password123`
- **User**: username: `user`, password: `user123`

**Important**: Change these default passwords immediately after deployment!

## Database Notes

- Uses SQLite database stored in `/tmp/` directory (serverless compatible)
- Database is recreated on each cold start
- User data persists during warm function execution
- For production, consider using external database (PostgreSQL, MySQL, etc.)

## Security Considerations

1. **Change Default Passwords**: Update default user passwords immediately
2. **Environment Variables**: Never commit sensitive data to version control
3. **HTTPS**: Vercel automatically provides HTTPS
4. **Session Management**: Uses secure session configuration

## Troubleshooting

### Common Issues:

1. **Database Connection Errors**:
   - Check if database initialization is working in serverless functions
   - Verify `/tmp/` directory permissions

2. **File Upload Issues**:
   - Ensure BrowserStack credentials are correctly set
   - Check file size limits (100MB max)

3. **Authentication Problems**:
   - Verify session secret is set
   - Check if default users are being created

### Logs and Debugging:

- View function logs in Vercel dashboard
- Use `vercel logs` command for real-time logs
- Check browser developer tools for client-side errors

## Post-Deployment Steps

1. **Test Authentication**: Login with default credentials
2. **Upload Test APK**: Verify BrowserStack integration
3. **Change Passwords**: Update default user passwords
4. **Create Additional Users**: Use admin panel if needed

## Support

If you encounter issues:
1. Check Vercel function logs
2. Verify environment variables are set correctly
3. Ensure BrowserStack credentials are valid
4. Test locally first with `vercel dev`

Your dashboard should now be live at your Vercel deployment URL!
