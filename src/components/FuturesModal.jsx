// src/components/FuturesModal.jsx

import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import BetRow from "./BetRow";
import { getAllBets } from "../utils/betService";

const TAB_OPTIONS = [
  "All",
  // Mobile: show short labels, Desktop: show full labels
  <span className="hidden sm:inline">Player Awards</span>,
  <span className="sm:hidden">Awards</span>,
  <span className="hidden sm:inline">Team Futures</span>,
  <span className="sm:hidden">Futures</span>,
  <span className="hidden sm:inline">Stat Leaders</span>,
  <span className="sm:hidden">Leaders</span>,
  <span className="hidden sm:inline">Props</span>,
  <span className="sm:hidden">Props</span>,
];

const FuturesModal = ({ sport, deleteMode }) => {
  const [data, setData] = useState([]);
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState(params.get("tab") || "All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getAllBets();
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
      <div className="mb-2">
        <h2 className="text-xl font-bold text-white mb-4">{sport}</h2>
        {/* Tabs */}
        <div className="flex flex-wrap gap-1 sm:gap-2 mb-4">
          {[
            "All",
            "Player Awards",
            "Team Futures",
            "Stat Leaders",
            "Props",
          ].map((tab, idx) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`py-2 text-sm font-medium rounded-lg transition-colors px-2.5 sm:px-4 ${
                selectedTab === tab
                  ? "bg-neutral-500 text-neutral-900 shadow-lg text-white border-neutral-300"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
              }`}
            >
              {/* Show short label on mobile, full label on desktop */}
              {tab === "Player Awards" ? (
                <>
                  <span className="hidden sm:inline">Player Awards</span>
                  <span className="sm:hidden">Awards</span>
                </>
              ) : tab === "Stat Leaders" ? (
                <>
                  <span className="hidden sm:inline">Stat Leaders</span>
                  <span className="sm:hidden">Leaders</span>
                </>
              ) : tab === "Team Futures" ? (
                <>
                  <span className="hidden sm:inline">Team Futures</span>
                  <span className="sm:hidden">Futures</span>
                </>
              ) : (
                <span>{tab}</span>
              )}
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
