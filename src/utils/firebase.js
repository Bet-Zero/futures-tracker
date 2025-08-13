import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDdrkWUVX_8LnqsstTZcN_h4YHB2hpyBME",
  authDomain: "futures-tracker-1.firebaseapp.com",
  databaseURL: "https://futures-tracker-1-default-rtdb.firebaseio.com", // Added database URL
  projectId: "futures-tracker-1",
  storageBucket: "futures-tracker-1.firebasestorage.app",
  messagingSenderId: "858706406427",
  appId: "1:858706406427:web:a88b268ea24d97d7e6dcbe",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db };
