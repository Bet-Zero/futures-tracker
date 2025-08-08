// src/components/BetRow.jsx

import React from "react";
import { nbaLogoMap, nflLogoMap, mlbLogoMap } from "../utils/logoMap";

// 🧠 Logo mapping logic by league
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

const BetRow = ({ bet }) => {
  const { type, player, team, image, odds, league, details = {} } = bet;
  const logoUrl = getTeamLogo(league, team);

  // 🧾 Main display text
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
      label = `${player} — ${details.ou} ${details.line}`;
      break;
    default:
      label = player || team;
  }

  // 🏷️ Tag pill
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
    <div
      className="relative overflow-hidden rounded px-3 py-2"
      style={{
        backgroundImage: logoUrl ? `url(${logoUrl})` : undefined,
        backgroundSize: "cover",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
      }}
    >
      {/* 🔲 Semi-transparent black overlay to dim background logo */}
      {logoUrl && <div className="absolute inset-0 bg-neutral/90 z-0" />}

      {/* 📦 Content */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* 🖼️ Player Image */}
          {image && (
            <img
              src={image}
              alt=""
              className="w-8 h-8 rounded object-cover flex-shrink-0"
            />
          )}

          {/* 🧾 Label */}
          <span className="text-white text-sm font-medium truncate">
            {label}
          </span>

          {/* 🏷️ Tag */}
          {tag && (
            <span className="ml-2 bg-neutral-700 text-neutral-200 text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap">
              {tag}
            </span>
          )}
        </div>

        {/* 💸 Odds */}
        <span className="text-green-400 font-semibold text-sm whitespace-nowrap">
          {odds}
        </span>
      </div>
    </div>
  );
};

export default BetRow;
