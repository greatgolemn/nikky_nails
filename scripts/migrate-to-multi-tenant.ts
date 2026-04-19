import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// This script migrates the existing single-tenant data to the new multi-tenant architecture.
// It assigns a default tenantId to all existing documents (members, packages, transactions, bookings).
//
// Usage:
// 1. Ensure you have the firebase-admin service account key saved as `serviceAccountKey.json` in the project root.
// 2. tsx scripts/migrate-to-multi-tenant.ts <defaultTenantId> <ownerUid>

const serviceAccountPath = path.resolve('serviceAccountKey.json');

if (!fs.existsSync(serviceAccountPath)) {
  console.error('Error: serviceAccountKey.json not found in project root.');
  console.error('Please download it from Firebase Console -> Project Settings -> Service Accounts.');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function migrate() {
  const args = process.argv.slice(2);
  const defaultTenantId = args[0] || 'tenant_nikkynails_01';
  const ownerUid = args[1] || 'superadmin_uid_here'; // Replace or pass via CLI

  console.log(`Starting migration to multi-tenant...`);
  console.log(`Target default tenant ID: ${defaultTenantId}`);
  console.log(`Owner UID: ${ownerUid}\n`);

  // 1. Setup default Tenant document
  console.log('1. Setting up default Tenant...');
  await db.collection('tenants').doc(defaultTenantId).set({
    shopName: 'Nikki Nail',
    shopPhone: '08X-XXX-XXXX',
    ownerId: ownerUid,
    isActive: true,
    subscription: {
      plan: 'pro',
      status: 'active',
      maxMembers: 1000,
      startedAt: FieldValue.serverTimestamp(),
    },
    createdAt: FieldValue.serverTimestamp()
  }, { merge: true });

  // 2. Setup owner UserProfile
  console.log(`2. Setting up UserProfile for owner: ${ownerUid}...`);
  await db.collection('users').doc(ownerUid).set({
    email: 'admin@nikkynail.com', // Update with actual email later
    role: 'super_admin', // Upgrade to super admin initially
    tenantId: null,      // super_admin doesn't need tenantId, but can manage all
    createdAt: FieldValue.serverTimestamp()
  }, { merge: true });

  // 3. Migrate Collections
  const collectionsToMigrate = ['members', 'packages', 'transactions', 'bookings', 'packageTemplates', 'serviceTemplates', 'branches'];

  for (const collName of collectionsToMigrate) {
    console.log(`\nMigrating collection: [${collName}]...`);
    const snapshot = await db.collection(collName).get();
    let updatedCount = 0;

    const batch = db.batch();
    for (const doc of snapshot.docs) {
      const data = doc.data();
      if (!data.tenantId) {
        batch.update(doc.ref, { tenantId: defaultTenantId });
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      await batch.commit();
      console.log(`✓ Updated ${updatedCount} documents in ${collName}.`);
    } else {
      console.log(`- All documents in ${collName} already have a tenantId.`);
    }
  }

  // 4. Migrate ShopConfig -> Move from 'shopConfig/main' to 'shopConfig/{tenantId}'
  console.log('\n4. Migrating ShopConfig...');
  const mainConfigRaw = await db.collection('shopConfig').doc('main').get();
  if (mainConfigRaw.exists) {
    const data = mainConfigRaw.data();
    await db.collection('shopConfig').doc(defaultTenantId).set({
      ...data,
      theme: { primaryColor: '#f1aeb5', logoUrl: '' }
    }, { merge: true });
    console.log(`✓ Copied shopConfig/main to shopConfig/${defaultTenantId}`);
    
    // Optional: Delete old config
    // await db.collection('shopConfig').doc('main').delete();
  } else {
    console.log('- shopConfig/main not found, skipping.');
  }

  console.log('\n✅ Migration complete!');
  process.exit(0);
}

migrate().catch(console.error);
