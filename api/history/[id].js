// Handle DELETE requests for specific history records
// This is a dynamic route: /api/history/[id]

// Simple in-memory storage (matches history.js)
// In production, use a proper database
let uploadHistory = [];

module.exports = async function handler(req, res) {
  const { id } = req.query;
  
  if (req.method === 'DELETE') {
    const recordId = parseInt(id);
    const initialLength = uploadHistory.length;
    uploadHistory = uploadHistory.filter(record => record.id !== recordId);
    
    if (uploadHistory.length < initialLength) {
      return res.status(200).json({ success: true, message: 'Record deleted' });
    } else {
      return res.status(404).json({ error: 'Record not found' });
    }
  }
  
  res.setHeader('Allow', ['DELETE']);
  return res.status(405).json({ error: 'Method not allowed' });
};
