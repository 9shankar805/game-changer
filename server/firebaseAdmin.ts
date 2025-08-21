import admin from 'firebase-admin';

// Initialize Firebase Admin SDK
const firebaseConfig = {
  type: "service_account",
  project_id: "myweb-1c1f37b3",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
};

let firebaseApp: admin.app.App;

try {
  if (!admin.apps.length) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(firebaseConfig as admin.ServiceAccount),
      projectId: "myweb-1c1f37b3"
    });
    console.log('✅ Firebase Admin initialized');
  } else {
    firebaseApp = admin.app();
  }
} catch (error) {
  console.warn('⚠️ Firebase Admin not configured:', error.message);
}

export const sendFCMNotification = async (
  token: string,
  title: string,
  body: string,
  data?: any
) => {
  try {
    if (!firebaseApp) {
      // Fallback to simple notification without Firebase Admin
      console.log('📱 FCM notification (no admin):', { title, body, token: token.substring(0, 20) + '...' });
      return true;
    }

    const message = {
      notification: {
        title,
        body
      },
      data: data || {},
      token
    };

    const response = await admin.messaging().send(message);
    console.log('✅ FCM notification sent:', response);
    return true;
  } catch (error) {
    console.log('⚠️ FCM notification logged:', { title, body, error: error.message });
    return true; // Return true to not block the flow
  }
};

export const sendFCMToMultiple = async (
  tokens: string[],
  title: string,
  body: string,
  data?: any
) => {
  try {
    if (!firebaseApp || tokens.length === 0) {
      return false;
    }

    const message = {
      notification: {
        title,
        body
      },
      data: data || {},
      tokens
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log(`✅ FCM sent to ${response.successCount}/${tokens.length} devices`);
    return response.successCount > 0;
  } catch (error) {
    console.error('❌ FCM multicast failed:', error);
    return false;
  }
};

export default firebaseApp;