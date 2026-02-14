import admin from "firebase-admin";

if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_ADMIN_CREDENTIALS_JSON as string,
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function verifyFirebaseToken(idToken: string) {
  return admin.auth().verifyIdToken(idToken);
}
