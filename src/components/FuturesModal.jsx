// src/components/FuturesModal.jsx

import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import BetRow from "./BetRow";
import { getAllBets } from "../utils/betService";

// Map UI tab names -> canonical labels used in data (bet.tabLabel)
const TAB_TO_LABEL = {
  All: "All",
  "Player Awards": "Awards",
  "Team Futures": "Team Futures",
  "Stat Leaders": "Stat Leaders",
  Props: "Props",
};

// Reverse map so URLs with ?category= work even without ?tab=
const LABEL_TO_TAB = {
  All: "All",
  Awards: "Player Awards",
  "Team Futures": "Team Futures",
  "Stat Leaders": "Stat Leaders",
  Props: "Props",
};

const toLabel = (tab) => TAB_TO_LABEL[tab] || tab || "All";
const toTab = (label) => LABEL_TO_TAB[label] || label || "All";

const FuturesModal = ({ sport, deleteMode }) => {
  const [data, setData] = useState([]);
  const [params] = useSearchParams();
  const navigate = useNavigate();

  // Initial tab can come from ?tab= (UI name) OR ?category= (canonical)
  const urlTab = params.get("tab");
  const urlCategory = params.get("category");
  const initialTab = urlTab || toTab(urlCategory) || "All";

  const [selectedTab, setSelectedTab] = useState(initialTab);

  // Keep selectedTab synced if URL changes externally
  useEffect(() => {
    const t = params.get("tab");
    const c = params.get("category");
    const next = t || toTab(c) || "All";
    if (next !== selectedTab) setSelectedTab(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  // Fetch bets for league
  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getAllBets();
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

    const updateListener = () => fetchData();
    window.addEventListener("betsUpdated", updateListener);
    return () => window.removeEventListener("betsUpdated", updateListener);
  }, [sport]);

  // Tag the modal so /api/snap can wait for the exact category
  useEffect(() => {
    const el = document.getElementById("futures-modal");
    if (el) el.setAttribute("data-active-category", toLabel(selectedTab));
  }, [selectedTab]);

  const handleTabChange = (tab) => {
    setSelectedTab(tab);

    // Write both tab (UI name) and category (canonical) to URL
    const nextParams = new URLSearchParams();
    nextParams.set("sport", sport);
    nextParams.set("tab", tab);
    nextParams.set("category", toLabel(tab));
    navigate(`?${nextParams.toString()}`, { replace: true });
  };

  // Filter by canonical label used in data
  const activeLabel = toLabel(selectedTab);
  const filtered =
    activeLabel === "All"
      ? data
      : data.filter(
          (b) => (b.tabLabel || "").toLowerCase() === activeLabel.toLowerCase()
        );

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
          ].map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`py-2 text-sm font-medium rounded-lg transition-colors px-2.5 sm:px-4 ${
                selectedTab === tab
                  ? "bg-neutral-500 text-neutral-900 shadow-lg text-white border-neutral-300"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
              }`}
            >
              {/* Short labels on mobile */}
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
