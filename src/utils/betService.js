import { ref, get, set, remove, push, child } from "firebase/database";
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
    return snapshot.val() || {};
  } catch (err) {
    console.error("Failed to fetch bets:", err);
    throw new Error("Failed to load bets");
  }
}

export async function addBet(bet) {
  try {
    const { league, tabLabel } = bet;
    if (!league || !tabLabel) throw new Error("Missing required fields");

    // Get current bets for this league and tab
    const leagueRef = ref(db, `${BETS_REF}/${league}/${tabLabel}`);
    const snapshot = await get(leagueRef);
    const currentBets = snapshot.val() || [];

    // Add new bet to beginning of array
    currentBets.unshift(bet);

    // Limit to 100 bets per category
    if (currentBets.length > 100) {
      currentBets.length = 100;
    }

    // Save updated array with origin metadata
    await set(leagueRef, currentBets, { headers: { origin: appOrigin } });
    return bet;
  } catch (err) {
    console.error("Failed to save bet:", err);
    throw new Error("Failed to save bet");
  }
}

export async function deleteBet({
  league,
  tabLabel,
  date,
  player,
  team,
  odds,
  site,
}) {
  try {
    if (!league || !tabLabel || !date) {
      throw new Error("Missing required fields");
    }

    const leagueRef = ref(db, `${BETS_REF}/${league}/${tabLabel}`);
    const snapshot = await get(leagueRef);
    const bets = snapshot.val() || [];

    const normalize = (v) => (v === undefined || v === null ? "" : String(v));
    const filteredBets = bets.filter(
      (b) =>
        !(
          String(b.date) === String(date) &&
          normalize(b.player) === normalize(player) &&
          normalize(b.team) === normalize(team) &&
          normalize(b.odds) === normalize(odds) &&
          normalize(b.site) === normalize(site)
        )
    );

    if (filteredBets.length === bets.length) {
      throw new Error("Bet not found");
    }

    // Save with origin metadata
    await set(leagueRef, filteredBets, { headers: { origin: appOrigin } });
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
