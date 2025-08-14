// src/utils/betService.js

// -------------------------------------------------------------
// RTDB Bets Helpers — Option B (object-per-bet with auto-ID)
// -------------------------------------------------------------
// - addBet: uses push() to create /bets/{sport}/{category}/{betId}
// - getAllBets: reads objects and normalizes to arrays (newest first)
// - deleteBet: deletes by betId (preferred) or falls back to createdAt match
// - migrateBetsToFirebase: optional bulk seeding into Option B structure
// -------------------------------------------------------------

import { ref, get, set, push, remove } from "firebase/database";
import { db } from "./firebase";

const BETS_REF = "bets";

// ----------------------------------------------
// Helper: safe get child snapshot value as object
// ----------------------------------------------
function asObj(val) {
  if (!val || typeof val !== "object") return {};
  return val;
}

// ----------------------------------------------
// GET ALL BETS (normalized)
// Returns: { [sport]: { [category]: Bet[] } }
// Each Bet array is newest-first (by createdAt)
// ----------------------------------------------
export async function getAllBets() {
  try {
    const betsRef = ref(db, BETS_REF);
    const snapshot = await get(betsRef);
    const root = asObj(snapshot.val());

    const normalized = {};

    for (const [sportKey, categories] of Object.entries(asObj(root))) {
      normalized[sportKey] = {};

      for (const [catKey, betMap] of Object.entries(asObj(categories))) {
        // betMap is { betId: betObject, ... }
        const arr = Object.entries(asObj(betMap)).map(([id, doc]) => {
          const sport = doc.sport ?? doc.league ?? sportKey;
          const category = doc.category ?? doc.type ?? doc.tabLabel ?? catKey;

          return {
            id, // include betId for easy deletes/edits
            ...doc,
            sport,
            category,
            market: doc.market ?? doc.subtype ?? "",
            odds_american: doc.odds_american ?? doc.odds ?? "",
          };
        });

        // newest first by createdAt (number or stringified number)
        arr.sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0));

        normalized[sportKey][catKey] = arr;
      }
    }

    return normalized;
  } catch (err) {
    console.error("Failed to fetch bets:", err);
    throw new Error("Failed to load bets");
  }
}

// ----------------------------------------------
// ADD BET (auto-ID under /bets/{sport}/{category})
// Returns the full saved object with `id`
// ----------------------------------------------
export async function addBet(bet) {
  try {
    const { sport, category } = bet;
    if (!sport || !category) throw new Error("Missing required fields");

    const listRef = ref(db, `${BETS_REF}/${sport}/${category}`);

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

    const newRef = push(listRef); // /bets/{sport}/{category}/{autoId}
    await set(newRef, payload);

    const saved = { id: newRef.key, ...payload };

    // Debug visibility (safe to keep during dev)
    console.log(
      "RTDB addBet →",
      JSON.stringify(
        {
          path: `${BETS_REF}/${sport}/${category}/${newRef.key}`,
          data: saved,
        },
        null,
        2
      )
    );

    return saved;
  } catch (err) {
    console.error("Failed to save bet:", err);
    throw new Error("Failed to save bet");
  }
}

// ----------------------------------------------
// DELETE BET
// Preferred: pass { sport, category, betId }
// Fallback: if betId missing, tries to find by createdAt
// ----------------------------------------------
export async function deleteBet({ sport, category, betId, createdAt }) {
  try {
    if (!sport || !category) {
      throw new Error("Missing required fields (sport/category)");
    }

    // If we have an explicit betId, delete directly
    if (betId) {
      const betRef = ref(db, `${BETS_REF}/${sport}/${category}/${betId}`);
      await remove(betRef);
      return { removed: 1, by: "betId" };
    }

    // Fallback: find by createdAt (less reliable; recommended to pass betId)
    if (!createdAt) {
      throw new Error("Missing betId or createdAt");
    }

    const catRef = ref(db, `${BETS_REF}/${sport}/${category}`);
    const snap = await get(catRef);
    const betMap = asObj(snap.val());

    const match = Object.entries(betMap).find(
      ([, b]) => String(b?.createdAt) === String(createdAt)
    );

    if (!match) throw new Error("Bet not found");

    const [matchId] = match;
    await remove(ref(db, `${BETS_REF}/${sport}/${category}/${matchId}`));
    return { removed: 1, by: "createdAt", betId: matchId };
  } catch (err) {
    console.error("Failed to delete bet:", err);
    throw new Error(err.message || "Failed to delete bet");
  }
}

// ----------------------------------------------
// OPTIONAL: Bulk seeding into Option B structure
// Input shape example:
// {
//   NFL: {
//     Awards: [ { ...bet }, { ...bet } ],
//     "Team Futures": [ { ...bet } ]
//   },
//   NBA: {
//     Awards: [ { ...bet } ]
//   }
// }
// (Arrays will be pushed under auto-IDs. If you pass an object with keys,
// it will try to write those keys verbatim. Arrays are simplest.)
// ----------------------------------------------
export async function migrateBetsToFirebase(betsData) {
  try {
    if (!betsData || typeof betsData !== "object") {
      throw new Error("migrateBetsToFirebase expects an object");
    }

    // For each sport/category, push each bet as its own child
    const tasks = [];

    for (const [sport, categories] of Object.entries(betsData)) {
      for (const [category, items] of Object.entries(asObj(categories))) {
        const listRef = ref(db, `${BETS_REF}/${sport}/${category}`);

        // If it's an array, push each; if it's an object, write exact keys.
        if (Array.isArray(items)) {
          for (const bet of items) {
            const payload = {
              sport,
              category,
              market: bet.market || "",
              selection: bet.selection,
              odds_american: bet.odds_american ?? bet.odds ?? "",
              line: bet.line ?? null,
              book: bet.book ?? "",
              notes: bet.notes ?? "",
              createdAt: bet.createdAt ?? Date.now(),
            };
            const newRef = push(listRef);
            tasks.push(set(newRef, payload));
          }
        } else {
          // object: { customId: bet, ... } — write verbatim keys
          for (const [customId, bet] of Object.entries(items || {})) {
            const payload = {
              sport,
              category,
              market: bet.market || "",
              selection: bet.selection,
              odds_american: bet.odds_american ?? bet.odds ?? "",
              line: bet.line ?? null,
              book: bet.book ?? "",
              notes: bet.notes ?? "",
              createdAt: bet.createdAt ?? Date.now(),
            };
            tasks.push(
              set(
                ref(db, `${BETS_REF}/${sport}/${category}/${customId}`),
                payload
              )
            );
          }
        }
      }
    }

    await Promise.all(tasks);
    return true;
  } catch (err) {
    console.error("Migration failed:", err);
    return false;
  }
}
