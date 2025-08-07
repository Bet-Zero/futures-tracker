// src/components/BetRow.jsx

import React from "react";
import { nbaLogoMap, nflLogoMap, mlbLogoMap } from "../utils/logoMap";

const getTeamLogo = (league, teamOrLabel) => {
  const map =
    league === "NBA"
      ? nbaLogoMap
      : league === "NFL"
      ? nflLogoMap
      : league === "MLB"
      ? mlbLogoMap
      : {};
  return map?.[teamOrLabel] || null;
};

console.log("BET ROW LOGO:", label, team, league, logoUrl);

const BetRow = ({
  label,
  lineText,
  oddsText,
  rightText,
  tag,
  team,
  league,
}) => {
  const logoUrl = getTeamLogo(league, team || label);

  return (
    <div
      className="relative overflow-hidden rounded px-3 py-2"
      style={{
        backgroundImage: logoUrl ? `url(${logoUrl})` : undefined,
        backgroundSize: "cover", // fill entire row
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center",
        opacity: 1, // no fade
      }}
    >
      {/* Optional: Add semi-transparent black layer ONLY if needed */}
      <div className="absolute inset-0 bg-black/10 z-0" />

      {/* Row Content */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex-1 pr-4 text-white text-sm font-medium truncate">
          {label}
        </div>
        <div className="flex items-center justify-end gap-2 min-w-[180px] text-right">
          <div className="w-[110px] flex justify-end">
            {(lineText || tag) && (
              <span className="bg-black/70 px-2 py-0.5 rounded text-xs font-medium text-neutral-100 whitespace-nowrap">
                {lineText || tag}
              </span>
            )}
          </div>
          <div className="w-[60px] text-right">
            <span className="text-green-400 font-semibold text-sm whitespace-nowrap">
              {oddsText || rightText}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BetRow;
