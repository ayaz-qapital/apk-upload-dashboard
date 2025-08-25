// In-memory storage for upload history (will reset on each deployment)
// For persistent storage, consider using a database service like Vercel KV or external database
let uploadHistory = [];

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET') {
    return res.json(uploadHistory);
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'ID parameter is required' });
    }

    const recordId = parseInt(id);
    uploadHistory = uploadHistory.filter(record => record.id !== recordId);
    
    return res.json({ success: true, message: 'Record deleted' });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
