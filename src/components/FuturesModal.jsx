// src/components/FuturesModal.jsx

import React, { useState, useEffect } from "react";
import { futuresByLeague } from "../data/futuresData";

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

const BetRow = ({ label, lineText, oddsText, rightText, tag }) => {
  const displayTag = lineText || tag;

  return (
    <div className="flex items-center justify-between px-3 py-2 rounded bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors">
      {/* Left: Bet Label */}
      <div className="flex-1 pr-4 text-white text-sm font-medium truncate">
        {label}
      </div>

      {/* Right: Tag and Odds */}
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
  );
};

const FuturesModal = ({ sport }) => {
  const data = futuresByLeague[sport] || [];

  const [selectedType, setSelectedType] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedGroup, setSelectedGroup] = useState("All");

  // ✅ Apply URL params on first mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const typeParam = urlParams.get("type");
    const categoryParam = urlParams.get("category");
    const groupParam = urlParams.get("group");

    if (typeParam) setSelectedType(typeParam);
    if (categoryParam) setSelectedCategory(categoryParam);
    if (groupParam) setSelectedGroup(groupParam);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    params.set("sport", sport);
    params.set("type", selectedType);
    params.set("category", selectedCategory);
    params.set("group", selectedGroup);
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
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
    <div className="w-full max-w-2xl mx-auto text-white bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">{sport}</h2>

        {/* Tabs */}
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
