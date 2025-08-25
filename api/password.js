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

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    await initDatabase();
    
    const { action } = req.query;
    
    if (action === 'change') {
      const { userId, currentPassword, newPassword, confirmPassword } = req.body;

      if (!userId || !currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ 
          success: false, 
          error: 'User ID, current password, new password, and confirmation are required' 
        });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ 
          success: false, 
          error: 'New password and confirmation do not match' 
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ 
          success: false, 
          error: 'New password must be at least 6 characters long' 
        });
      }

      try {
        await db.changePassword(userId, currentPassword, newPassword);
        res.json({ 
          success: true, 
          message: 'Password changed successfully' 
        });
      } catch (error) {
        console.error('Password change error:', error);
        if (error.message === 'Current password is incorrect') {
          res.status(400).json({ success: false, error: 'Current password is incorrect' });
        } else {
          res.status(500).json({ success: false, error: 'Failed to change password' });
        }
      }
    } else {
      res.status(400).json({ success: false, error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Password API error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
}
