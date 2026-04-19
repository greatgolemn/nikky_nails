import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

async function clearDatabase() {
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf-8'));

    if (!getApps().length) {
      initializeApp({
        projectId: firebaseConfig.projectId,
      });
    }
    const db = getFirestore(firebaseConfig.firestoreDatabaseId);

    const collections = ['members', 'packages', 'transactions'];
    console.log('เริ่มล้างข้อมูล...');

    for (const collName of collections) {
      const snapshot = await db.collection(collName).get();
      if (snapshot.empty) {
        console.log(`คอลเลกชัน ${collName} ไม่มีข้อมูล`);
        continue;
      }

      const batch = db.batch();
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();
      console.log(`ล้างข้อมูลใน ${collName} เรียบร้อย (${snapshot.size} รายการ)`);
    }

    console.log('--- ล้างข้อมูลทั้งหมดเรียบร้อยแล้ว ---');
    process.exit(0);
  } catch (error) {
    console.error('เกิดข้อผิดพลาด:', error);
    process.exit(1);
  }
}

clearDatabase();
