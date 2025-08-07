// src/components/FuturesModal.jsx

import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { futuresByLeague } from "../data/futuresData";
import BetRow from "./BetRow";

const TAB_OPTIONS = [
  "All",
  "Player Awards",
  "Team Bets",
  "Stat Leaders",
  "Props",
];

const FuturesModal = ({ sport }) => {
  const data = futuresByLeague[sport] || [];
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [selectedTab, setSelectedTab] = useState(
    params.get("tab") || "All"
  );

  const handleTabChange = (tab) => {
    setSelectedTab(tab);
    const nextParams = new URLSearchParams();
    nextParams.set("sport", sport);
    nextParams.set("tab", tab);
    navigate(`?${nextParams.toString()}`, { replace: true });
  };

  const filtered =
    selectedTab === "All"
      ? data
      : data.filter((b) => b.tabLabel === selectedTab);

  return (
    <div
      id="futures-modal"
      className="w-full max-w-2xl mx-auto text-white bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl p-6"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">{sport}</h2>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-4">
          {TAB_OPTIONS.map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedTab === tab
                  ? "bg-neutral-500 text-neutral-900 shadow-lg text-white border-neutral-300"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Bets List */}
      <div className="space-y-1.5 max-h-96 overflow-y-auto">
        {filtered.length > 0 ? (
          filtered.map((bet, i) => <BetRow key={i} bet={bet} />)
        ) : (
          <div className="text-center py-8 text-neutral-400">
            No bets found for the selected tab.
          </div>
        )}
      </div>
    </div>
  );
};

export default FuturesModal;
