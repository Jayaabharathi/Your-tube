// src/lib/firebase.js

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// 🔹 Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBkQ-0eSn5r5lczqarL4a31Fm8pgt9QxMc",
  authDomain: "your-tube-ba8ef.firebaseapp.com",
  projectId: "your-tube-ba8ef",
  storageBucket: "your-tube-ba8ef.appspot.com",
  messagingSenderId: "676016909010",
  appId: "1:676016909010:web:d5a1e895d519f8367a9b0b",
  measurementId: "G-XJ5W23KL3L",
};

// ✅ Prevent Firebase re-initialization
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// ✅ Auth ONLY runs in browser
const auth = typeof window !== "undefined" ? getAuth(app) : null;

// ✅ Google provider
const provider = new GoogleAuthProvider();

export { auth, provider };

