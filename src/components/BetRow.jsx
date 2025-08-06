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
    <div className="relative overflow-hidden rounded">
      {/* Faded Background Logo */}
      {logoUrl && (
        <img
          src={logoUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-contain opacity-10 pointer-events-none scale-125"
        />
      )}

      {/* Content */}
      <div className="relative z-10 flex items-center justify-between px-3 py-2 bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors">
        {/* Player Label */}
        <div className="flex-1 pr-4 text-white text-sm font-medium truncate">
          {label}
        </div>

        {/* Right Side */}
        <div className="flex items-center justify-end gap-2 min-w-[180px] text-right">
          <div className="w-[110px] flex justify-end">
            {(lineText || tag) && (
              <span className="bg-neutral-700 px-2 py-0.5 rounded text-xs font-medium text-neutral-200 whitespace-nowrap">
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
