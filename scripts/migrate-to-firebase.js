import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BETS_FILE = path.join(__dirname, "..", "bets.json");

const firebaseConfig = {
  apiKey: "AIzaSyDdrkWUVX_8LnqsstTZcN_h4YHB2hpyBME",
  authDomain: "futures-tracker-1.firebaseapp.com",
  databaseURL: "https://futures-tracker-1-default-rtdb.firebaseio.com",
  projectId: "futures-tracker-1",
  storageBucket: "futures-tracker-1.firebasestorage.app",
  messagingSenderId: "858706406427",
  appId: "1:858706406427:web:a88b268ea24d97d7e6dcbe",
};

async function migrateBets() {
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);

    // Read existing bets
    console.log("Reading bets from bets.json...");
    const betsData = fs.readFileSync(BETS_FILE, "utf8");
    const bets = JSON.parse(betsData);

    // Save to Firebase
    console.log("Saving bets to Firebase...");
    const betsRef = ref(db, "bets");
    await set(betsRef, bets);

    console.log("✅ Migration successful!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
}

migrateBets();
