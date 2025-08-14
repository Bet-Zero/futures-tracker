// src/components/BetRow.jsx

import React, { useMemo, useState } from "react";
import { nbaLogoMap, nflLogoMap, mlbLogoMap } from "../utils/logoMap";
import getHeadshotUrl from "../utils/getHeadshotUrl";
import logoBgPosition from "../data/logoBgPosition";
import { deleteBet } from "../utils/betService";

// Map sport -> team logo
// Enhanced getTeamLogo: supports full team names
const getTeamLogo = (sport, team) => {
  let map;
  if (sport === "NBA") map = nbaLogoMap;
  else if (sport === "NFL") map = nflLogoMap;
  else if (sport === "MLB") map = mlbLogoMap;
  else map = {};

  // Try direct match
  if (map?.[team]) return map[team];
  // Try to match by mascot (last word)
  if (typeof team === "string") {
    const mascot = team.split(" ").pop();
    if (map?.[mascot]) return map[mascot];
  }
  return null;
};

// "Patrick Mahomes" -> "PM"
const getInitials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || "")
    .join("");

// Headshot that NEVER changes the row height
const Headshot = ({ src, name, isTeamLogo }) => {
  const [err, setErr] = useState(false);
  const initials = useMemo(() => getInitials(name), [name]);

  return (
    <div
      className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-md border border-neutral-900 overflow-hidden bg-neutral-800 grid place-items-center shadow-lg"
      style={{
        boxShadow: "0 0px 0px 0 rgba(0,0,0,0.0), 0 0.0px 0 rgba(0,0,0,0.0)",
      }}
    >
      {!err && src ? (
        <img
          src={src}
          alt={name || ""}
          className={
            isTeamLogo
              ? "w-full h-full object-fill"
              : "w-full h-full object-cover"
          }
          style={
            isTeamLogo
              ? { display: "block", transform: "scale(1.00)" }
              : { display: "block", transform: "scale(1.30)" }
          }
          onError={() => setErr(true)}
        />
      ) : (
        <span className="text-white/80 text-[10px] md:text-xs font-bold select-none leading-none">
          {initials || "—"}
        </span>
      )}
    </div>
  );
};

function getLogoBgPosition(team) {
  // Try full name first
  if (logoBgPosition[team]) return logoBgPosition[team];
  // Try mascot (last word)
  const mascot = typeof team === "string" ? team.split(" ").pop() : team;
  if (logoBgPosition[mascot]) return logoBgPosition[mascot];
  return "center 50%";
}

// Helper to split player name
function splitPlayerName(name = "") {
  const parts = name.split(" ").filter(Boolean);
  if (parts.length === 1) return [parts[0], ""];
  return [parts.slice(0, -1).join(" "), parts.slice(-1).join(" ")];
}
// Helper to split team name (city, mascot)
function splitTeamName(team = "") {
  const parts = team.split(" ").filter(Boolean);
  if (parts.length === 1) return [parts[0], ""];
  return [parts.slice(0, -1).join(" "), parts.slice(-1).join(" ")];
}

const BetRow = ({ bet, deleteMode }) => {
  const { category, player, team, image, odds_american, sport, details = {} } =
    bet || {};
  const logoUrl = getTeamLogo(sport, team);

  // For Team Futures, use team logo as headshot
  const isTeamLogo = category === "Team Futures";
  const headshotSrc = isTeamLogo
    ? logoUrl
    : getHeadshotUrl(player, sport, image);

  // Main label
  let label = "";
  let labelTop = "";
  let labelBottom = "";
  switch (category) {
    case "Awards":
      label = player;
      [labelTop, labelBottom] = splitPlayerName(player || "");
      break;
    case "Team Futures":
      label = team;
      [labelTop, labelBottom] = splitTeamName(team || "");
      break;
    case "Stat Leaders":
      label = player;
      [labelTop, labelBottom] = splitPlayerName(player || "");
      break;
    case "Props":
      label = player;
      [labelTop, labelBottom] = splitPlayerName(player || "");
      break;
    default:
      label = player || team || "";
      [labelTop, labelBottom] = splitPlayerName(label);
  }

  // Pill text
  let tag = "";
  if (category === "Awards") {
    tag = details.award || "";
  } else if (category === "Team Futures") {
    const ou = details.ou === "Over" ? "o" : details.ou === "Under" ? "u" : "";
    if (details.value) {
      // Change 'Win Total' to 'Wins' for display
      const betLabel = details.bet === "Win Total" ? "Wins" : details.bet || "";
      tag = `${ou}${details.value} ${betLabel}`.trim();
    } else {
      tag = details.bet === "Win Total" ? "Wins" : details.bet || "";
    }
  } else if (category === "Stat Leaders") {
    tag = details.stat || "";
  } else if (category === "Props") {
    const ou = details.ou === "Over" ? "o" : details.ou === "Under" ? "u" : "";
    tag = `${ou}${details.line || ""} ${details.stat || ""}`.trim();
  }

  const handleDelete = async () => {
    if (!window.confirm("Remove this bet?")) return;
    try {
      await deleteBet({
        sport: bet.sport || bet.league,
        category: bet.category || bet.tabLabel || bet.type,
        createdAt: bet.createdAt || bet.date,
      });
      window.dispatchEvent(new Event("betsUpdated"));
    } catch (error) {
      console.error("Error deleting bet:", error);
      alert(error.message || "Error removing bet.");
    }
  };

  // For background logo band
  const bgPosition = getLogoBgPosition(team);

  return (
    <div className="relative flex items-center justify-between bg-neutral-800 rounded border border-black overflow-hidden px-3 py-2">
      {/* Faint background logo band (doesn't affect height) */}
      {logoUrl && (
        <div className="absolute inset-0 flex items-center pointer-events-none opacity-35">
          <img
            src={logoUrl}
            alt=""
            className="w-full h-full object-cover py-1.5 px-1 rounded-lg border-2 border-black/50"
            style={{ objectPosition: bgPosition }}
          />
          <div className="absolute inset-0 bg-neutral-800 opacity-85" />
        </div>
      )}

      {/* Main row content: headshot, label, tag, odds */}
      <div className="relative z-10 flex items-center w-full min-w-0">
        {/* Headshot */}
        <Headshot
          src={headshotSrc}
          name={player || team}
          isTeamLogo={isTeamLogo}
        />

        {/* Label */}
        {/* Mobile: two lines, Desktop: one line */}
        <span
          className="ml-3 text-white text-sm md:text-base font-bold truncate uppercase hidden sm:inline"
          style={{
            textShadow:
              "0px 2px 6px rgba(0,0,0,0.45), 0px 0.5px 0px rgba(0,0,0,0.8)",
          }}
        >
          {label}
        </span>
        <span
          className="ml-3 text-white text-xs font-bold truncate uppercase sm:hidden flex flex-col leading-tight"
          style={{
            textShadow:
              "0px 2px 6px rgba(0,0,0,0.45), 0px 0.5px 0px rgba(0,0,0,0.8)",
          }}
        >
          {/* Restore player/team split for mobile, remove Awards/Leaders override */}
          <span>{labelTop}</span>
          <span>{labelBottom}</span>
        </span>

        {/* Spacer to push tag/odds to the right */}
        <div className="flex-1" />

        {/* Tag and Odds: right-aligned, fixed widths for perfect alignment */}
        <div className="flex items-center" style={{ minWidth: 0 }}>
          {/* Tag: always right-aligned, fixed width */}
          <div className="flex items-center justify-end w-[90px]">
            {tag ? (
              <span
                className="bg-neutral-500/80 text-white text-xs md:text-sm font-bold px-2 py-0.5 rounded-lg whitespace-nowrap"
                style={{
                  textShadow:
                    "0px 2px 6px rgba(0,0,0,0.45), 0px 0.5px 0px rgba(0,0,0,0.8)",
                }}
              >
                {tag}
              </span>
            ) : null}
          </div>
          {/* Odds: always right-aligned, fixed width */}
          <div className="flex-shrink-0 w-[70px] ml-2 flex items-center justify-end">
            {odds_american ? (
              <span className="text-white text-sm md:text-base font-bold tracking-widest whitespace-nowrap">
                {odds_american}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Delete button */}
      {deleteMode && (
        <div className="absolute top-3.5 right-2 z-20">
          <button
            onClick={handleDelete}
            className="text-xs px-2 py-1 bg-red-700 hover:bg-red-600 text-white rounded shadow"
            title="Remove bet"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default BetRow;
