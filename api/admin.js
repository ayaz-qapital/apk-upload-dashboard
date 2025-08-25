export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { method } = req;
  const { action } = req.query;

  if (method === 'POST' && action === 'create-user') {
    // For demo purposes, just return success
    res.json({ 
      success: true, 
      message: 'User created successfully',
      user: { id: Date.now(), username: 'demo-user', role: 'user' }
    });
  } else if (method === 'GET' && action === 'users') {
    // Return mock users list
    res.json({ 
      success: true, 
      users: [
        { id: 1, username: 'admin', role: 'admin' },
        { id: 2, username: 'user', role: 'user' }
      ]
    });
  } else {
    res.status(405).json({ success: false, error: 'Method not allowed' });
  }
}
