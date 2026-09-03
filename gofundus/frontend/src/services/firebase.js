import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const firebaseConfigured = Object.values(firebaseConfig).every(Boolean);
const app = firebaseConfigured
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null;
const auth = app ? getAuth(app) : null;
const storage = app ? getStorage(app) : null;

export async function uploadProfilePhoto(file, username) {
  if (!firebaseConfigured || !auth || !storage) return null;

  const session = auth.currentUser || (await signInAnonymously(auth)).user;
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const photoRef = ref(storage, `avatars/${session.uid}/${username}.${extension}`);
  await uploadBytes(photoRef, file, { contentType: file.type });
  return getDownloadURL(photoRef);
}
