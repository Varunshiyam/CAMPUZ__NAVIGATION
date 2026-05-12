import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Firebase configuration for campuz-navigation-shanu
const firebaseConfig = {
    apiKey: "AIzaSyBIeLrtBpvEhULANLO-h67e1Uo-n20d32I",
    authDomain: "campuz-navigation-shanu.firebaseapp.com",
    projectId: "campuz-navigation-shanu",
    storageBucket: "campuz-navigation-shanu.firebasestorage.app",
    messagingSenderId: "363434573221",
    appId: "1:363434573221:web:d1e787bf21c16e05643c4c",
    measurementId: "G-L8SR3LQRB5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth
const auth = getAuth(app);

// Enable offline persistence for better performance
try {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
            console.warn('The current browser does not support persistence.');
        }
    });
} catch (err) {
    console.error('Error enabling persistence:', err);
}

export { db, auth };
