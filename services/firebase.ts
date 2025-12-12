import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBLgEAly1324kCsCCbiNaCn-jWD6XEC7WE",
  authDomain: "jobiq-63695.firebaseapp.com",
  projectId: "jobiq-63695",
  storageBucket: "jobiq-63695.firebasestorage.app",
  messagingSenderId: "52161589584",
  appId: "1:52161589584:web:3c22044bf69a2000073c55"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);

// Log initialization to confirm script execution and help debug domain issues
console.log("Firebase initialized with project:", firebaseConfig.projectId);
console.log("Current detected hostname:", window.location.hostname);
console.log("Current full URL:", window.location.href);
