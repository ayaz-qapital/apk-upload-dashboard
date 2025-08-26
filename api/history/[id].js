import fs from 'fs-extra';
import path from 'path';

const DATA_DIR = '/tmp';
const DB_FILE = path.join(DATA_DIR, 'uploads.json');

const readHistory = async () => {
  try {
    if (await fs.pathExists(DB_FILE)) {
      return await fs.readJson(DB_FILE);
    }
    return [];
  } catch {
    return [];
  }
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const items = await readHistory();
    const item = items.find(i => i.id === id);
    
    if (!item) {
      return res.status(404).json({ error: 'Not found' });
    }
    
    res.json(item);
  } catch (err) {
    console.error('History item error:', err);
    res.status(500).json({ error: 'Failed to fetch history item' });
  }
}
