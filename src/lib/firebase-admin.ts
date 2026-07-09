import * as admin from 'firebase-admin';

// Normalize private key: handle escaped \n, actual newlines, and surrounding quotes
function normalizePrivateKey(key: string | undefined): string | undefined {
  if (!key) return undefined;
  return key
    .replace(/^"|"$/g, '')       // remove surrounding quotes
    .replace(/\\n/g, '\n');      // replace literal \n with actual newline
}

// Fungsi untuk mendapatkan instance messaging yang aman
export function getAdminMessaging() {
  if (!admin.apps.length) {
    try {
      const privateKey = normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY);
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

      console.log('Firebase init - projectId:', projectId);
      console.log('Firebase init - clientEmail:', clientEmail);
      console.log('Firebase init - privateKey starts with:', privateKey?.substring(0, 30));

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('Firebase Admin initialized successfully');
    } catch (error) {
      console.error('Firebase admin initialization error:', error);
      return null;
    }
  }
  return admin.messaging();
}

export async function sendPushNotification(tokens: string[], title: string, body: string, data?: Record<string, string>) {
  if (!tokens || tokens.length === 0) {
    console.log('sendPushNotification: no tokens provided');
    return;
  }

  console.log(`Sending push notification to ${tokens.length} device(s): "${title}"`);

  const messaging = getAdminMessaging();
  if (!messaging) {
    console.error('Push notification aborted: Firebase admin not initialized properly.');
    return;
  }

  const message = {
    notification: { title, body },
    data: data || {},
    tokens,
    android: {
      priority: 'high' as const,
      notification: {
        sound: 'default',
        priority: 'max' as const,
        channelId: 'spp_ppmh_channel',
        defaultVibrateTimings: true,
      },
    },
    apns: {
      payload: { aps: { sound: 'default', badge: 1 } },
    },
    webpush: {
      headers: { Urgency: 'high' },
      notification: {
        title,
        body,
        icon: '/logo-ppmh.png',
        requireInteraction: true,
      },
    },
  };

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Firebase push notification timeout after 15s')), 15000)
    );

    const response = await Promise.race([
      messaging.sendEachForMulticast(message as any),
      timeoutPromise,
    ]) as admin.messaging.BatchResponse;

    console.log(`FCM Result: ${response.successCount} berhasil, ${response.failureCount} gagal dari ${tokens.length} token`);

    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.error(`Token ke-${idx} gagal: ${resp.error?.code} - ${resp.error?.message}`);
        }
      });
    }
  } catch (error) {
    console.error('Error sending FCM message:', error);
  }
}
