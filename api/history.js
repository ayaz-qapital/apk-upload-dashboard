// Simple in-memory history storage for demo purposes
// In production, you'd use a database like Vercel KV, Planetscale, etc.
let uploadHistory = [];

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    // Return upload history
    return res.status(200).json(uploadHistory);
  }
  
  if (req.method === 'POST') {
    // Add new upload record
    const record = req.body;
    if (record) {
      uploadHistory.unshift(record);
    }
    return res.status(200).json({ success: true });
  }
  
  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({ error: 'Method not allowed' });
};
