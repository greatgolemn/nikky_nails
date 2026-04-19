import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import * as line from '@line/bot-sdk';
import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read Firebase Config
const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));

// Initialize Firebase Admin
if (!getApps().length) {
  initializeApp({
    projectId: firebaseConfig.projectId,
  });
}
const db = getFirestore(firebaseConfig.firestoreDatabaseId);

const app = express();
const port = 3000;

// LINE Config
const lineConfig = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || 'DUMMY',
  channelSecret: process.env.LINE_CHANNEL_SECRET || 'DUMMY',
};

// Use middleware only for the real webhook route
const lineMiddleware = line.middleware(lineConfig);

async function handleEvent(event: any, client: any) {
  if (event.type !== 'follow') return null;

  const userId = event.source.userId;
  try {
    // Get profile
    const profile = await client.getProfile(userId);
    const { displayName } = profile;

    // Check if member exists by lineUserId
    const membersRef = db.collection('members');
    const snapshot = await membersRef.where('lineUserId', '==', userId).limit(1).get();

    if (snapshot.empty) {
      // Create new member automatically
      await membersRef.add({
        name: displayName,
        phone: 'LINE-' + userId.slice(-4),
        points: 0,
        totalSpent: 0,
        tier: 'Bronze',
        lineUserId: userId,
        lineDisplayName: displayName,
        createdAt: new Date().toISOString(),
      });
      
      // Send welcome message
      await client.replyMessage({
        replyToken: event.replyToken,
        messages: [{ type: 'text', text: `ยินดีต้อนรับคุณ ${displayName} สู่ Nickki nail! คุณได้สมัครสมาชิกเรียบร้อยแล้วค่ะ ✨` }],
      });
    }
  } catch (error) {
    console.error('Error handling LINE follow:', error);
  }
  return null;
}

// API Routes
app.post('/api/line-webhook', lineMiddleware, (req, res) => {
  const client = new line.messagingApi.MessagingApiClient(lineConfig);
  Promise.all(req.body.events.map((event: any) => handleEvent(event, client)))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// Simulation endpoint for frontend to demonstrate the "Auto-Signup" flow
app.post('/api/simulate-line-follow', express.json(), async (req, res) => {
  const { userId, displayName } = req.body;
  
  if (!userId || !displayName) {
    return res.status(400).json({ error: 'Missing userId or displayName' });
  }

  try {
    const membersRef = db.collection('members');
    const snapshot = await membersRef.where('lineUserId', '==', userId).limit(1).get();

    if (snapshot.empty) {
      await membersRef.add({
        name: displayName,
        phone: 'SIM-' + userId.slice(-4),
        points: 0,
        totalSpent: 0,
        tier: 'Bronze',
        lineUserId: userId,
        lineDisplayName: displayName,
        createdAt: new Date().toISOString(),
      });
      res.json({ success: true, message: `Successfully registered ${displayName} via simulated LINE Add Friend.` });
    } else {
      res.json({ success: true, message: 'Member already exists in the system.' });
    }
  } catch (error: any) {
    console.error('Simulation Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Diagnostic endpoint
app.get('/api/admin/diag', async (req, res) => {
  try {
    const results: any = {};
    const collections = ['members', 'packages', 'transactions'];
    for (const coll of collections) {
      const snap = await db.collection(coll).get();
      results[coll] = {
        count: snap.size,
        firstFew: snap.docs.slice(0, 3).map(d => ({ id: d.id, ...d.data() }))
      };
    }
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Middleware for Vite
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distPath = path.join(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
