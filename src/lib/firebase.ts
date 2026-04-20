import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyArGFp6Kb1RhSqxW0f1BV_E_PODMVeOYlE",
  authDomain: "ppmh-notif.firebaseapp.com",
  projectId: "ppmh-notif",
  storageBucket: "ppmh-notif.firebasestorage.app",
  messagingSenderId: "926177679010",
  appId: "1:926177679010:web:a4cd1c577634091424a9fb",
  measurementId: "G-5G7Y2KF2XX"
};

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const requestForToken = async (vapidKey: string) => {
  try {
    const messaging = getMessaging(app);
    const currentToken = await getToken(messaging, { vapidKey });
    if (currentToken) {
      console.log('Current token for client: ', currentToken);
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.log('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => {
      console.log("Payload", payload);
      resolve(payload);
    });
  });
