import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyC2XBmH9IbugMqbYv3OvoF1DLsZT_v4zXk',
  authDomain: 'sticker-tracker-a3713.firebaseapp.com',
  projectId: 'sticker-tracker-a3713',
  storageBucket: 'sticker-tracker-a3713.firebasestorage.app',
  messagingSenderId: '969932003325',
  appId: '1:969932003325:web:ab93593247862a3fad2b94',
};

export const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

