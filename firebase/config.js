// firebase/config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDSYdEaXTddMB81b9NHJUSW8kJquQw8rf0",
  authDomain: "plsnhs-enrollment-1b9ec.firebaseapp.com",
  projectId: "plsnhs-enrollment-1b9ec",
  storageBucket: "plsnhs-enrollment-1b9ec.firebasestorage.app",
  messagingSenderId: "911994931190",
  appId: "1:911994931190:web:0ad907ed64f9d90e9a69d7",
  measurementId: "G-QGVTZL5CGZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log('🔥 Firebase initialized!');
console.log('✅ Project:', firebaseConfig.projectId);