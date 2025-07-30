// src/components/FuturesModal.jsx

import React, { useState } from "react";
import { futures } from "../data/futuresData";

const typeOptions = ["All", "Futures", "Awards", "Props", "Leaders"];
const getCategoriesForType = (type) => {
  const filtered =
    type === "All" ? futures : futures.filter((b) => b.type === type);
  const categories = [...new Set(filtered.map((b) => b.category))];
  return categories;
};

const BetRow = ({ label, rightText, starred }) => (
  <div className="flex justify-between items-center px-4 py-1 rounded hover:bg-white/5">
    <span
      className={`text-sm ${
        starred ? "font-bold italic text-yellow-300" : "text-white"
      }`}
    >
      {starred && "⭐"} {label}
    </span>
    <span className="text-sm text-gray-400">{rightText}</span>
  </div>
);

const FuturesModal = () => {
  const [selectedType, setSelectedType] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = getCategoriesForType(selectedType);
  const filtered = futures.filter((b) => {
    const matchType = selectedType === "All" || b.type === selectedType;
    const matchCat =
      selectedCategory === "All" || b.category === selectedCategory;
    return matchType && matchCat;
  });

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-[600px] bg-neutral-900 border border-white/10 rounded-2xl shadow-xl p-6">
        {/* Tabs */}
        <div className="flex justify-center mb-4 flex-wrap gap-2">
          {typeOptions.map((type) => (
            <button
              key={type}
              onClick={() => {
                setSelectedType(type);
                setSelectedCategory("All");
              }}
              className={`px-3 py-1 text-sm rounded-full border ${
                selectedType === type
                  ? "bg-white text-black border-white"
                  : "border-white/20 text-white hover:border-white/40"
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Dropdown for category */}
        {categories.length > 1 && (
          <div className="mb-4">
            <select
              className="w-full bg-neutral-800 text-white text-sm rounded border border-white/10 px-3 py-2"
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

        {/* Bets */}
        <div className="divide-y divide-white/5 rounded overflow-hidden">
          {filtered.map((bet, i) => (
            <BetRow
              key={`${bet.label}-${bet.rightText}-${i}`}
              label={bet.label}
              rightText={bet.rightText}
              starred={bet.starred}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default FuturesModal;
