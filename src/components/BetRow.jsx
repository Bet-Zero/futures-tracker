// src/components/BetRow.jsx

import React, { useMemo, useState } from "react";
import { nbaLogoMap, nflLogoMap, mlbLogoMap } from "../utils/logoMap";
import getHeadshotUrl from "../utils/getHeadshotUrl";
import logoBgPosition from "../data/logoBgPosition";

// Map league -> team logo
// Enhanced getTeamLogo: supports full team names
const getTeamLogo = (league, team) => {
  let map;
  if (league === "NBA") map = nbaLogoMap;
  else if (league === "NFL") map = nflLogoMap;
  else if (league === "MLB") map = mlbLogoMap;
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

const BetRow = ({ bet, deleteMode }) => {
  const { type, player, team, image, odds, league, details = {} } = bet || {};
  const logoUrl = getTeamLogo(league, team);

  // For Team Bet, use team logo as headshot
  const isTeamLogo = type === "Team Bet";
  const headshotSrc = isTeamLogo
    ? logoUrl
    : getHeadshotUrl(player, league, image);

  // Main label
  let label = "";
  switch (type) {
    case "Player Award":
      label = player;
      break;
    case "Team Bet":
      label = team;
      break;
    case "Stat Leader":
      label = player;
      break;
    case "Prop":
      label = player;
      break;
    default:
      label = player || team || "";
  }

  // Pill text
  let tag = "";
  if (type === "Player Award") {
    tag = details.award || "";
  } else if (type === "Team Bet") {
    const ou = details.ou === "Over" ? "o" : details.ou === "Under" ? "u" : "";
    if (details.value) {
      tag = `${ou}${details.value} ${details.bet || ""}`.trim();
    } else {
      tag = details.bet || "";
    }
  } else if (type === "Stat Leader") {
    tag = details.stat || "";
  } else if (type === "Prop") {
    const ou = details.ou === "Over" ? "o" : details.ou === "Under" ? "u" : "";
    tag = `${ou}${details.line || ""} ${details.stat || ""}`.trim();
  }

  const handleDelete = async () => {
    if (!window.confirm("Remove this bet?")) return;
    try {
      await fetch("/api/bets/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          league: bet.league,
          tabLabel: bet.tabLabel,
          date: bet.date,
          player: bet.player,
          team: bet.team,
          odds: bet.odds,
          site: bet.site,
        }),
      });
      window.dispatchEvent(new Event("betsUpdated"));
    } catch {
      alert("Error removing bet.");
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
          <div className="absolute inset-0 bg-neutral-800 opacity-90" />
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
        <span
          className="ml-2 text-white text-sm md:text-base font-bold truncate uppercase"
          style={{
            textShadow:
              "0px 2px 6px rgba(0,0,0,0.45), 0px 0.5px 0px rgba(0,0,0,0.8)",
          }}
        >
          {label}
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
            {odds ? (
              <span className="text-white text-sm md:text-base font-bold tracking-widest whitespace-nowrap">
                {odds}
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
