// src/components/FuturesModal.jsx

import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import BetRow from "./BetRow";

const TAB_OPTIONS = [
  "All",
  "Player Awards",
  "Team Futures",
  "Stat Leaders",
  "Props",
];

const FuturesModal = ({ sport, deleteMode }) => {
  const [data, setData] = useState([]);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(params.get("tab") || "All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/bets");
        const result = await response.json();
        // Flatten bets for the selected league
        let leagueBets = [];
        if (result && result[sport]) {
          Object.values(result[sport]).forEach((arr) => {
            leagueBets = leagueBets.concat(arr);
          });
        }
        setData(leagueBets);
      } catch (error) {
        console.error("Error fetching bets:", error);
      }
    };
    fetchData();
    // Listen for bet updates
    const updateListener = () => fetchData();
    window.addEventListener("betsUpdated", updateListener);
    return () => window.removeEventListener("betsUpdated", updateListener);
  }, [sport]);

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
      style={{ maxHeight: "90vh", overflowY: "auto" }}
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
          filtered.map((bet, i) => (
            <BetRow key={i} bet={bet} deleteMode={deleteMode} />
          ))
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
