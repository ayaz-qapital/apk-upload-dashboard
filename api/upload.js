module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  // For now, return a mock successful upload
  // In production, you'd implement actual BrowserStack upload logic
  const uploadRecord = {
    id: Date.now(),
    fileName: 'demo.apk',
    fileSize: 1024000,
    uploadTime: new Date().toISOString(),
    appUrl: 'bs://mock-app-url-' + Date.now(),
    customId: 'mock-custom-id',
    status: 'success'
  };
  
  res.json({
    success: true,
    message: 'APK uploaded successfully to BrowserStack',
    data: uploadRecord
  });
};
