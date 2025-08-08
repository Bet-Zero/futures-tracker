// src/components/BetRow.jsx

import React, { useMemo, useState } from "react";
import { nbaLogoMap, nflLogoMap, mlbLogoMap } from "../utils/logoMap";
import getHeadshotUrl from "../utils/getHeadshotUrl";

// Map league -> team logo
const getTeamLogo = (league, team) => {
  const map =
    league === "NBA"
      ? nbaLogoMap
      : league === "NFL"
      ? nflLogoMap
      : league === "MLB"
      ? mlbLogoMap
      : {};
  return map?.[team] || null;
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
const Headshot = ({ src, name }) => {
  const [err, setErr] = useState(false);
  const initials = useMemo(() => getInitials(name), [name]);

  return (
    <div className="flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-lg border border-black overflow-hidden bg-black grid place-items-center">
      {!err && src ? (
        <img
          src={src}
          alt={name || ""}
          className="w-full h-full object-cover"
          style={{ display: "block", transform: "scale(1.30)" }}
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

const BetRow = ({ bet }) => {
  const { type, player, team, image, odds, league, details = {} } = bet || {};
  const logoUrl = getTeamLogo(league, team);

  // Get headshot image for NFL players
  const headshotSrc = getHeadshotUrl(player, league, image);

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
      label = `${player} — ${details.ou ?? ""} ${details.line ?? ""}`.trim();
      break;
    default:
      label = player || team || "";
  }

  // Pill text
  const tag =
    type === "Player Award"
      ? details.award
      : type === "Team Bet"
      ? details.bet
      : type === "Stat Leader"
      ? details.stat
      : type === "Prop"
      ? details.stat
      : "";

  return (
    <div className="relative flex items-center justify-between bg-black rounded overflow-hidden px-3 py-2">
      {/* Faint background logo band (doesn't affect height) */}
      {logoUrl && (
        <div className="absolute inset-0 flex items-center bg-white pointer-events-none opacity-40">
          <img
            src={logoUrl}
            alt=""
            className="w-full h-full object-cover py-1.5 px-1 rounded-lg border-2 border-black/50"
          />
        </div>
      )}

      {/* Left: headshot + label + pill */}
      <div className="relative z-10 flex items-center gap-2 flex-1 min-w-0">
        <Headshot src={headshotSrc} name={player || team} />

        <span className="text-white text-sm md:text-base font-bold truncate uppercase [text-shadow:_0px_2px_3px_rgb(0_0_0_/_0.25)]">
          {label}
        </span>

        {tag ? (
          <span className="bg-neutral-500 text-white text-xs md:text-sm font-bold px-2 py-0.5 rounded-2xl whitespace-nowrap">
            {tag}
          </span>
        ) : null}
      </div>

      {/* Right: odds */}
      {odds ? (
        <div className="relative z-10 flex-shrink-0">
          <span className="text-white text-sm md:text-base font-bold tracking-widest whitespace-nowrap">
            {odds}
          </span>
        </div>
      ) : null}
    </div>
  );
};

export default BetRow;
