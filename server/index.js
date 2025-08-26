import express from 'express';
import cors from 'cors';
import multer from 'multer';
import axios from 'axios';
import FormData from 'form-data';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const DATA_DIR = path.resolve('data');
const DB_FILE = path.join(DATA_DIR, 'uploads.json');

await fs.ensureDir(DATA_DIR);
if (!(await fs.pathExists(DB_FILE))) {
  await fs.writeJson(DB_FILE, []);
}

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 300 * 1024 * 1024 } });

const readHistory = async () => (await fs.readJson(DB_FILE));
const writeHistory = async (data) => fs.writeJson(DB_FILE, data, { spaces: 2 });

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/history', async (_req, res) => {
  const items = await readHistory();
  res.json(items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.get('/api/history/:id', async (req, res) => {
  const items = await readHistory();
  const item = items.find(i => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});

app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    const { file } = req;
    if (!file) return res.status(400).json({ error: 'No file provided' });

    const isApk = file.originalname.toLowerCase().endsWith('.apk') ||
                  file.mimetype === 'application/vnd.android.package-archive';
    if (!isApk) return res.status(400).json({ error: 'Only .apk files are supported in this version' });

    const username = process.env.BROWSERSTACK_USERNAME;
    const accessKey = process.env.BROWSERSTACK_ACCESS_KEY;
    if (!username || !accessKey) {
      return res.status(500).json({ error: 'BrowserStack credentials not configured' });
    }

    const form = new FormData();
    form.append('file', file.buffer, { filename: file.originalname });

    const bsResponse = await axios.post(
      'https://api-cloud.browserstack.com/app-automate/upload',
      form,
      {
        auth: { username, password: accessKey },
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    const { app_url, app_id, shareable_id } = bsResponse.data || {};
    if (!app_url) {
      return res.status(502).json({ error: 'Unexpected BrowserStack response', details: bsResponse.data });
    }

    const record = {
      id: uuidv4(),
      fileName: file.originalname,
      size: file.size,
      createdAt: new Date().toISOString(),
      app_url,
      app_id: app_id || null,
      shareable_id: shareable_id || null
    };

    const items = await readHistory();
    items.push(record);
    await writeHistory(items);

    res.json(record);
  } catch (err) {
    console.error(err?.response?.data || err);
    res.status(500).json({
      error: 'Upload failed',
      details: err?.response?.data || err?.message || 'Unknown error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
