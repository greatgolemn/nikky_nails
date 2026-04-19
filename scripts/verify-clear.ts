import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

async function checkAndClear() {
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));

    if (!getApps().length) {
      initializeApp({
        projectId: firebaseConfig.projectId,
      });
    }
    const db = getFirestore(firebaseConfig.firestoreDatabaseId);

    const collections = ['members', 'packages', 'transactions'];
    
    for (const collName of collections) {
      const snapshot = await db.collection(collName).get();
      console.log(`Collection: ${collName} -> Found ${snapshot.size} documents.`);
      
      if (snapshot.size > 0) {
        console.log(`Clearing ${collName}...`);
        const batch = db.batch();
        snapshot.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        console.log(`Successfully cleared ${collName}.`);
      }
    }
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAndClear();
