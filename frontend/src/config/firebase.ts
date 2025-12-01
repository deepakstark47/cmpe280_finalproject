import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate Firebase configuration
const envVarMap: Record<string, string> = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
};

const missingFields = Object.entries(envVarMap).filter(
  ([field]) => !firebaseConfig[field as keyof typeof firebaseConfig] || firebaseConfig[field as keyof typeof firebaseConfig] === ''
);

if (missingFields.length > 0) {
  console.error('❌ Firebase Configuration Error: Missing required environment variables:');
  missingFields.forEach(([, envVar]) => {
    console.error(`   - ${envVar}`);
  });
  console.error('\n📝 Please check your .env file and ensure all Firebase variables are set.');
  console.error('💡 You can find these values in your Firebase Console under Project Settings > General > Your apps');
  console.error('📋 Required variables:');
  Object.values(envVarMap).forEach((envVar) => {
    console.error(`   ${envVar}=your_value_here`);
  });
}

// Initialize Firebase
let app;
let auth;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  if (missingFields.length === 0) {
    console.log('✅ Firebase initialized successfully');
  } else {
    console.warn('⚠️ Firebase initialized with missing configuration. Authentication may not work properly.');
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw new Error('Failed to initialize Firebase. Please check your configuration.');
}

// Initialize Firebase Realtime Database
const database = getDatabase(app);

export { auth, database };
export default app;

