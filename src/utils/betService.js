// src/utils/firebaseBets.js

// -------------------------------------------------------------
// RTDB Bets Helpers — Option B (object-per-bet with auto-ID)
// (with robust normalization so rows never show blank labels)
// -------------------------------------------------------------

import { ref, get, set, push, remove } from "firebase/database";
import { db } from "./firebase";

const BETS_REF = "bets";

// App origin (not required for RTDB SDK, but keeping in case you use it elsewhere)
const appOrigin =
  typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:5173";

// -----------------------------
// Small helpers
// -----------------------------
function asObj(val) {
  if (!val || typeof val !== "object") return {};
  return val;
}

function normalizeIn(doc, sportKey, catKey) {
  // Normalize incoming DB doc -> UI shape
  const sport = doc.sport ?? doc.league ?? sportKey ?? "";
  const category = doc.category ?? doc.type ?? doc.tabLabel ?? catKey ?? "";
  const market = doc.market ?? doc.subtype ?? "";
  const selection = doc.selection ?? doc.player ?? doc.team ?? ""; // <<< key fix
  const odds_american = doc.odds_american ?? doc.odds ?? "";
  const book = doc.book ?? doc.site ?? "";
  // Ensure player/team/details fields exist for the UI
  const isTeamBet = String(category).toLowerCase() === "team futures";
  const player = doc.player ?? (isTeamBet ? null : selection);
  const team = doc.team ?? (isTeamBet ? selection : doc.team ?? "");
  const details = doc.details ?? {};
  const image = doc.image ?? "";

  return {
    ...doc,
    sport,
    category,
    market,
    selection,
    odds_american,
    book,
    player,
    team,
    details,
    image,
  };
}

function buildPayloadOut(bet) {
  // Normalize outbound payload -> DB
  const sport = bet.sport;
  const category = bet.category;
  const market = bet.market || "";
  const selection = bet.selection || bet.player || bet.team || ""; // <<< key fix
  const player = bet.player ?? (category === "Team Futures" ? null : selection);
  const team = bet.team ?? (category === "Team Futures" ? selection : bet.team || "");
  const details = bet.details ?? {};
  const image = bet.image ?? "";
  const odds_american = bet.odds_american ?? bet.odds ?? "";
  const line = bet.line ?? null;
  const book = bet.book ?? bet.site ?? "";
  const notes = bet.notes ?? "";
  const createdAt = bet.createdAt ?? Date.now();

  return {
    sport,
    category,
    market,
    selection,
    player,
    team,
    details,
    image,
    odds_american,
    line,
    book,
    notes,
    createdAt,
  };
}

// ----------------------------------------------
// GET ALL BETS (normalized)
// Returns: { [sport]: { [category]: Bet[] } } (newest-first)
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
          const n = normalizeIn(doc, sportKey, catKey);
          return { id, ...n };
        });

        // newest first
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
// Returns the saved object with `id`
// ----------------------------------------------
export async function addBet(bet) {
  try {
    const { sport, category } = bet;
    if (!sport || !category) throw new Error("Missing required fields");

    const listRef = ref(db, `${BETS_REF}/${sport}/${category}`);

    const payload = buildPayloadOut(bet);

    const newRef = push(listRef); // /bets/{sport}/{category}/{autoId}
    await set(newRef, payload);

    const saved = { id: newRef.key, ...payload };

    // Debug
    console.log(
      "RTDB addBet →",
      JSON.stringify(
        {
          path: `${BETS_REF}/${sport}/${category}/${newRef.key}`,
          data: saved,
          origin: appOrigin,
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

    // Direct by ID
    if (betId) {
      const betRef = ref(db, `${BETS_REF}/${sport}/${category}/${betId}`);
      await remove(betRef);
      return { removed: 1, by: "betId" };
    }

    // Fallback by createdAt
    if (!createdAt) throw new Error("Missing betId or createdAt");

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
// See earlier note; keeps same normalization
// ----------------------------------------------
export async function migrateBetsToFirebase(betsData) {
  try {
    if (!betsData || typeof betsData !== "object") {
      throw new Error("migrateBetsToFirebase expects an object");
    }

    const tasks = [];

    for (const [sport, categories] of Object.entries(betsData || {})) {
      for (const [category, items] of Object.entries(asObj(categories))) {
        const listRef = ref(db, `${BETS_REF}/${sport}/${category}`);

        if (Array.isArray(items)) {
          for (const raw of items) {
            const payload = buildPayloadOut({ ...raw, sport, category });
            const newRef = push(listRef);
            tasks.push(set(newRef, payload));
          }
        } else {
          for (const [customId, raw] of Object.entries(items || {})) {
            const payload = buildPayloadOut({ ...raw, sport, category });
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
