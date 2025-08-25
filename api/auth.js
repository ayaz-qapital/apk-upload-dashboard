const Database = require('../database-serverless');

// Initialize database instance
let db = null;
let dbInitialized = false;

async function initDatabase() {
  if (!db) {
    db = new Database();
    await db.init();
    dbInitialized = true;
  }
  return db;
}

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    await initDatabase();
    
    const { method } = req;
    const { action } = req.query;

    if (method === 'POST' && action === 'login') {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ success: false, error: 'Username and password are required' });
      }

      const user = await db.authenticateUser(username, password);
      
      if (user) {
        // In serverless environment, we'll return user data for client-side session management
        res.json({ 
          success: true, 
          message: 'Login successful',
          user: {
            id: user.id,
            username: user.username,
            role: user.role
          }
        });
      } else {
        res.status(401).json({ success: false, error: 'Invalid username or password' });
      }
    } else if (method === 'POST' && action === 'logout') {
      res.json({ success: true, message: 'Logged out successfully' });
    } else if (method === 'GET' && action === 'user-info') {
      // This would need to be handled client-side in serverless environment
      res.status(400).json({ success: false, error: 'User info should be managed client-side' });
    } else {
      res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Auth API error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
