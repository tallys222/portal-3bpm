import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD2TJP96sYVNk89NC2LqnLS0EqAwVl5l5A",
  authDomain: "painel-3bpm.firebaseapp.com",
  projectId: "painel-3bpm",
  storageBucket: "painel-3bpm.firebasestorage.app",
  messagingSenderId: "820768098263",
  appId: "1:820768098263:web:6b95ec0864a46c24392d92",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
