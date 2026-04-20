import * as admin from 'firebase-admin';

// Initialize Firebase Admin using Environment Variables for Security
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminMessaging = admin.messaging();

export async function sendPushNotification(tokens: string[], title: string, body: string, data?: Record<string, string>) {
  if (!tokens || tokens.length === 0) return;

  const message = {
    notification: {
      title,
      body,
    },
    data: data || {},
    tokens: tokens,
  };

  try {
    const response = await adminMessaging.sendEachForMulticast(message);
    console.log(response.successCount + ' messages were sent successfully');
    if (response.failureCount > 0) {
      const failedTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });
      console.log('List of tokens that caused failures: ' + failedTokens);
    }
  } catch (error) {
    console.error('Error sending message:', error);
  }
}
