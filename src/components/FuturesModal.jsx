// src/components/FuturesModal.jsx

import React, { useState } from "react";
import { futuresByLeague } from "../data/futuresData";

const typeOptions = ["All", "Futures", "Awards", "Props", "Leaders"];
const getCategoriesForType = (type, data) => {
  const filtered = type === "All" ? data : data.filter((b) => b.type === type);
  const categories = [...new Set(filtered.map((b) => b.category))];
  return categories;
};

const BetRow = ({ label, lineText, oddsText, rightText }) => (
  <div className="flex items-center justify-between px-3 py-2 rounded bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors">
    <div className="flex-1">
      <span className="text-white text-sm font-medium">{label}</span>
    </div>

    <div className="flex items-center gap-3">
      {lineText && oddsText ? (
        <>
          <span className="bg-neutral-700 px-2 py-0.5 rounded text-xs font-medium text-neutral-200">
            {lineText}
          </span>
          <span className="text-green-400 font-semibold text-sm min-w-[50px] text-right">
            {oddsText}
          </span>
        </>
      ) : (
        <span className="text-green-400 font-semibold text-sm">
          {rightText}
        </span>
      )}
    </div>
  </div>
);

const FuturesModal = ({ sport }) => {
  const data = futuresByLeague[sport] || [];

  const [selectedType, setSelectedType] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = getCategoriesForType(selectedType, data);
  const filtered = data.filter((b) => {
    const matchType = selectedType === "All" || b.type === selectedType;
    const matchCat =
      selectedCategory === "All" || b.category === selectedCategory;
    return matchType && matchCat;
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
              }}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedType === type
                  ? "bg-blue-600 text-white shadow-lg"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

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
            return (
              <BetRow
                key={`${bet.label}-${bet.rightText}-${i}`}
                label={bet.label}
                lineText={lineText}
                oddsText={oddsText}
                rightText={bet.rightText}
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
