// scripts/seed-admin.mjs
// Run this ONCE to create your admin account in Firestore
// Usage: node scripts/seed-admin.mjs
//
// BEFORE RUNNING:
// 1. Create your admin account in Firebase Authentication (Console > Auth > Add user)
// 2. Copy the UID shown in Firebase Console
// 3. Fill in the values below
// 4. Run: node scripts/seed-admin.mjs

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// ⚠️ Replace these with your actual values
const ADMIN_UID = 'PASTE_YOUR_UID_HERE';
const ADMIN_EMAIL = 'your@email.com';
const ADMIN_NAME = 'Your Name';

// ⚠️ Download your service account key from:
// Firebase Console > Project Settings > Service accounts > Generate new private key
// Then put the path to that JSON file here:
const SERVICE_ACCOUNT_PATH = './serviceAccountKey.json';

async function seedAdmin() {
  try {
    const serviceAccount = JSON.parse(
      await import('fs').then(fs => fs.promises.readFile(SERVICE_ACCOUNT_PATH, 'utf8'))
    );

    initializeApp({ credential: cert(serviceAccount) });
    const db = getFirestore();

    await db.collection('users').doc(ADMIN_UID).set({
      uid: ADMIN_UID,
      email: ADMIN_EMAIL,
      displayName: ADMIN_NAME,
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    });

    console.log('✅ Admin user created successfully!');
    console.log('You can now log in with:', ADMIN_EMAIL);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\nAlternatively, you can manually add the document in Firebase Console:');
    console.log('1. Go to Firestore > users collection');
    console.log('2. Add document with ID =', ADMIN_UID);
    console.log('3. Add these fields:');
    console.log(JSON.stringify({
      uid: ADMIN_UID,
      email: ADMIN_EMAIL,
      displayName: ADMIN_NAME,
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    }, null, 2));
    process.exit(1);
  }
}

seedAdmin();
