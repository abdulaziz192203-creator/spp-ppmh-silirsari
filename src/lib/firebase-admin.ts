import * as admin from 'firebase-admin';

// Fungsi untuk mendapatkan instance messaging yang aman
export function getAdminMessaging() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // Handle both escaped newlines and actual newlines
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')?.replace(/"/g, ''),
        }),
      });
    } catch (error) {
      console.error('Firebase admin initialization error:', error);
      return null;
    }
  }
  return admin.messaging();
}

export async function sendPushNotification(tokens: string[], title: string, body: string, data?: Record<string, string>) {
  if (!tokens || tokens.length === 0) return;

  const messaging = getAdminMessaging();
  if (!messaging) {
    console.error('Push notification aborted: Firebase admin not initialized properly.');
    return;
  }

  const message = {
    notification: {
      title,
      body,
    },
    data: data || {},
    tokens: tokens,
  };

  try {
    // Add a simple timeout promise to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Firebase push notification timeout')), 5000)
    );

    const response = await Promise.race([
      messaging.sendEachForMulticast(message),
      timeoutPromise
    ]) as admin.messaging.BatchResponse;

    console.log(response.successCount + ' messages were sent successfully');
  } catch (error) {
    console.error('Error sending message:', error);
  }
}
