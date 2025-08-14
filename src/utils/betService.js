import { ref, get, set } from "firebase/database";
import { db } from "./firebase";

const BETS_REF = "bets";

// Add app origins to Firebase config
const appOrigin =
  typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:5173";

export async function getAllBets() {
  try {
    const betsRef = ref(db, BETS_REF);
    const snapshot = await get(betsRef);
    const data = snapshot.val() || {};
    const normalized = {};
    for (const [sportKey, cats] of Object.entries(data)) {
      normalized[sportKey] = {};
      for (const [catKey, arr] of Object.entries(cats || {})) {
        normalized[sportKey][catKey] = (arr || []).map((doc) => ({
          ...doc,
          sport: doc.sport ?? doc.league ?? sportKey,
          category: doc.category ?? doc.type ?? doc.tabLabel ?? catKey,
          market: doc.market ?? doc.subtype ?? "",
          odds_american: doc.odds_american ?? doc.odds ?? "",
        }));
      }
    }
    return normalized;
  } catch (err) {
    console.error("Failed to fetch bets:", err);
    throw new Error("Failed to load bets");
  }
}

export async function addBet(bet) {
  try {
    const { sport, category } = bet;
    if (!sport || !category) throw new Error("Missing required fields");

    const sportRef = ref(db, `${BETS_REF}/${sport}/${category}`);
    const snapshot = await get(sportRef);
    const currentBets = snapshot.val() || [];

    const payload = {
      sport,
      category,
      market: bet.market || "",
      selection: bet.selection,
      odds_american: bet.odds_american ?? "",
      line: bet.line ?? null,
      book: bet.book ?? "",
      notes: bet.notes ?? "",
      createdAt: bet.createdAt ?? Date.now(),
    };
    currentBets.unshift(payload);

    if (currentBets.length > 100) {
      currentBets.length = 100;
    }

    await set(sportRef, currentBets, { headers: { origin: appOrigin } });
    return payload;
  } catch (err) {
    console.error("Failed to save bet:", err);
    throw new Error("Failed to save bet");
  }
}

export async function deleteBet({ sport, category, createdAt }) {
  try {
    if (!sport || !category || !createdAt) {
      throw new Error("Missing required fields");
    }

    const sportRef = ref(db, `${BETS_REF}/${sport}/${category}`);
    const snapshot = await get(sportRef);
    const bets = snapshot.val() || [];

    const filteredBets = bets.filter(
      (b) => String(b.createdAt) !== String(createdAt)
    );

    if (filteredBets.length === bets.length) {
      throw new Error("Bet not found");
    }

    await set(sportRef, filteredBets, { headers: { origin: appOrigin } });
    return { removed: bets.length - filteredBets.length };
  } catch (err) {
    console.error("Failed to delete bet:", err);
    throw new Error(err.message || "Failed to delete bet");
  }
}

// Optional: Add data migration utility
export async function migrateBetsToFirebase(betsData) {
  try {
    const betsRef = ref(db, BETS_REF);
    await set(betsRef, betsData, { headers: { origin: appOrigin } });
    return true;
  } catch (err) {
    console.error("Migration failed:", err);
    return false;
  }
}
