// src/components/BetRow.jsx

import React from "react";
import { nbaLogoMap, nflLogoMap, mlbLogoMap } from "../utils/logoMap";

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

  let label = "";
  switch (type) {
    case "Player Award":
      label = `${player} — ${details.award}`;
      break;
    case "Team Bet":
      label = `${team} — ${details.bet}${details.value ? ` ${details.value}` : ""}`;
      break;
    case "Stat Leader":
      label = `${player} — ${details.stat}`;
      break;
    case "Prop":
      label = `${player} — ${details.ou} ${details.line} ${details.stat}`;
      break;
    default:
      label = player || team;
  }

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
      {logoUrl && <div className="absolute inset-0 bg-black/10 z-0" />}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {image && (
            <img
              src={image}
              alt=""
              className="w-8 h-8 rounded object-cover flex-shrink-0"
            />
          )}
          <span className="text-white text-sm font-medium truncate">{label}</span>
          <span className="ml-2 bg-neutral-700 text-neutral-200 text-xs font-medium px-2 py-0.5 rounded whitespace-nowrap">
            {type}
          </span>
        </div>
        <span className="text-green-400 font-semibold text-sm whitespace-nowrap">
          {odds}
        </span>
      </div>
    </div>
  );
};

export default BetRow;
