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

// ============================================
// Multi-Tenant LINE Webhook (Dynamic per tenant)
// ============================================

/**
 * Each tenant registers their own LINE OA credentials.
 * Webhook URL pattern: POST /api/line-webhook/:tenantId
 * LINE sends events here → we look up tenant config → process events under that tenant.
 */
async function handleLineEvent(event: any, client: any, tenantId: string) {
  if (event.type !== 'follow') return null;

  const userId = event.source.userId;
  try {
    const profile = await client.getProfile(userId);
    const { displayName } = profile;

    // Check if member already exists in this tenant
    const membersRef = db.collection('members');
    const snapshot = await membersRef
      .where('tenantId', '==', tenantId)
      .where('lineUserId', '==', userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      // Get tenant info for welcome message
      const tenantDoc = await db.collection('tenants').doc(tenantId).get();
      const shopName = tenantDoc.exists ? tenantDoc.data()?.shopName : 'NailSaaS';

      // Create new member automatically under this tenant
      await membersRef.add({
        tenantId,
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
        messages: [{
          type: 'text',
          text: `ยินดีต้อนรับคุณ ${displayName} สู่ ${shopName}! คุณได้สมัครสมาชิกเรียบร้อยแล้วค่ะ ✨`
        }],
      });
    }
  } catch (error) {
    console.error(`Error handling LINE follow for tenant ${tenantId}:`, error);
  }
  return null;
}

// Dynamic LINE Webhook — each tenant has their own endpoint
app.post('/api/line-webhook/:tenantId', express.raw({ type: 'application/json' }), async (req, res) => {
  const { tenantId } = req.params;

  try {
    // 1. Look up tenant's LINE credentials from Firestore
    const tenantDoc = await db.collection('tenants').doc(tenantId).get();
    if (!tenantDoc.exists) {
      console.error(`Tenant not found: ${tenantId}`);
      return res.status(404).json({ error: 'Tenant not found' });
    }

    const tenantData = tenantDoc.data();
    if (!tenantData?.lineConfig?.channelAccessToken || !tenantData?.lineConfig?.channelSecret) {
      console.error(`LINE config not found for tenant: ${tenantId}`);
      return res.status(400).json({ error: 'LINE credentials not configured for this tenant' });
    }

    const tenantLineConfig = {
      channelAccessToken: tenantData.lineConfig.channelAccessToken,
      channelSecret: tenantData.lineConfig.channelSecret,
    };

    // 2. Validate LINE signature
    const signature = req.headers['x-line-signature'] as string;
    if (!signature || !line.validateSignature(req.body, tenantLineConfig.channelSecret, signature)) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // 3. Parse and process events
    const body = JSON.parse(req.body.toString());
    const client = new line.messagingApi.MessagingApiClient(tenantLineConfig);

    await Promise.all(
      body.events.map((event: any) => handleLineEvent(event, client, tenantId))
    );

    res.json({ success: true });
  } catch (err: any) {
    console.error('LINE Webhook Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// Simulation Endpoint (for development/testing)
// ============================================
app.post('/api/simulate-line-follow', express.json(), async (req, res) => {
  const { userId, displayName, tenantId } = req.body;

  if (!userId || !displayName || !tenantId) {
    return res.status(400).json({ error: 'Missing userId, displayName, or tenantId' });
  }

  try {
    const membersRef = db.collection('members');
    const snapshot = await membersRef
      .where('tenantId', '==', tenantId)
      .where('lineUserId', '==', userId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      await membersRef.add({
        tenantId,
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

// ============================================
// Admin API Routes
// ============================================

// List all tenants (Super Admin only)
app.get('/api/admin/tenants', express.json(), async (req, res) => {
  try {
    const tenantsSnap = await db.collection('tenants').get();
    const tenants = tenantsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ tenants, count: tenants.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle tenant active/inactive (Super Admin only)
app.patch('/api/admin/tenants/:tenantId', express.json(), async (req, res) => {
  const { tenantId } = req.params;
  const { isActive } = req.body;

  try {
    await db.collection('tenants').doc(tenantId).update({ isActive: !!isActive });
    res.json({ success: true, tenantId, isActive: !!isActive });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Platform-wide diagnostic endpoint
app.get('/api/admin/diag', async (req, res) => {
  try {
    const results: any = {};
    const collections = ['tenants', 'members', 'packages', 'transactions', 'bookings'];
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

// ============================================
// Health check
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// Vite Middleware (Development) / Static (Production)
// ============================================
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
