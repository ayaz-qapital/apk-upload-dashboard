const Database = require('../database-serverless');

// Initialize database instance
let db = null;

async function initDatabase() {
  if (!db) {
    db = new Database();
    await db.init();
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
    const { userRole } = req.body; // This would come from client-side session in serverless

    // Check admin role (in serverless, this needs to be validated client-side)
    if (userRole !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    if (method === 'POST' && action === 'create-user') {
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
    } else if (method === 'GET' && action === 'users') {
      try {
        const users = await db.getAllUsers();
        res.json({ success: true, users });
      } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch users' });
      }
    } else {
      res.status(405).json({ success: false, error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Admin API error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
