// src/components/FuturesModal.jsx

import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { futuresByLeague } from "../data/futuresData";
import { nbaLogoMap, nflLogoMap, mlbLogoMap } from "../utils/logoMap"; // <-- make sure this is imported

const typeOptions = ["All", "Futures", "Awards", "Props", "Leaders"];

const getCategoriesForType = (type, data, group) => {
  let filtered = type === "All" ? data : data.filter((b) => b.type === type);
  if (type === "Futures" && group && group !== "All") {
    filtered = filtered.filter((b) => b.group === group);
  }
  const categories = [...new Set(filtered.map((b) => b.category))];
  return categories;
};

const getGroupsForFutures = (data) => {
  const groups = data
    .filter((b) => b.type === "Futures" && b.group)
    .map((b) => b.group);
  return [...new Set(groups)];
};

const BetRow = ({ label, lineText, oddsText, rightText, tag, league }) => {
  const displayTag = lineText || tag;

  // Load player→team map
  const map = JSON.parse(localStorage.getItem("playerTeamMap") || "{}");
  const team = map[label];
  const logoSrc = team && league === "NBA" ? nbaLogoMap[team] : null;

  return (
    <div className="relative overflow-hidden rounded bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors px-3 py-2">
      {logoSrc && (
        <img
          src={logoSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-contain opacity-10 pointer-events-none"
          style={{ filter: "grayscale(100%)" }}
        />
      )}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex-1 pr-4 text-white text-sm font-medium truncate">
          {label}
        </div>
        <div className="flex items-center justify-end gap-2 min-w-[180px] text-right">
          <div className="w-[110px] flex justify-end">
            {displayTag && (
              <span className="bg-neutral-700 px-2 py-0.5 rounded text-xs font-medium text-neutral-200 whitespace-nowrap">
                {displayTag}
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

const FuturesModal = ({ sport }) => {
  const data = futuresByLeague[sport] || [];
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [selectedType, setSelectedType] = useState(params.get("type") || "All");
  const [selectedCategory, setSelectedCategory] = useState(
    params.get("category") || "All"
  );
  const [selectedGroup, setSelectedGroup] = useState(
    params.get("group") || "All"
  );

  useEffect(() => {
    const nextParams = new URLSearchParams();
    nextParams.set("sport", sport);
    nextParams.set("type", selectedType);
    nextParams.set("category", selectedCategory);
    nextParams.set("group", selectedGroup);
    navigate(`?${nextParams.toString()}`, { replace: true });
  }, [sport, selectedType, selectedCategory, selectedGroup]);

  const groups = getGroupsForFutures(data);
  const categories = getCategoriesForType(selectedType, data, selectedGroup);

  const filtered = data.filter((b) => {
    const matchType = selectedType === "All" || b.type === selectedType;
    const matchGroup =
      selectedType !== "Futures" ||
      selectedGroup === "All" ||
      b.group === selectedGroup;
    const matchCat =
      selectedCategory === "All" || b.category === selectedCategory;
    return matchType && matchGroup && matchCat;
  });

  return (
    <div
      id="futures-modal"
      className="w-full max-w-2xl mx-auto text-white bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl p-6"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">{sport}</h2>

        {/* Type Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {typeOptions.map((type) => (
            <button
              key={type}
              onClick={() => {
                setSelectedType(type);
                setSelectedCategory("All");
                setSelectedGroup("All");
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedType === type
                  ? "bg-neutral-500 text-neutral-900 shadow-lg text-white border-neutral-300"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Group Dropdown for Futures */}
        {selectedType === "Futures" && groups.length > 1 && (
          <div className="mb-4">
            <select
              className="w-full bg-neutral-800 text-white rounded-lg border border-neutral-600 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedGroup}
              onChange={(e) => {
                setSelectedGroup(e.target.value);
                setSelectedCategory("All");
              }}
            >
              <option value="All">All Futures</option>
              {groups.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Category Dropdown */}
        {categories.length > 1 && (
          <div className="mb-4">
            <select
              className="w-full bg-neutral-800 text-white rounded-lg border border-neutral-600 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Bets List */}
      <div className="space-y-1.5 max-h-96 overflow-y-auto">
        {filtered.length > 0 ? (
          filtered.map((bet, i) => {
            const hasProps = bet.type === "Props" && bet.line && bet.odds;
            const lineText = hasProps ? `${bet.ou || "o"}${bet.line}` : null;
            const oddsText = hasProps ? bet.odds : null;
            const tag = !hasProps ? bet.category : null;
            return (
              <BetRow
                key={`${bet.label}-${bet.rightText}-${i}`}
                label={bet.label}
                lineText={lineText}
                oddsText={oddsText}
                rightText={bet.rightText}
                tag={tag}
                league={sport}
              />
            );
          })
        ) : (
          <div className="text-center py-8 text-neutral-400">
            No bets found for the selected filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default FuturesModal;
