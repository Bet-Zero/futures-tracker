// src/components/FuturesModal.jsx

import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import BetRow from "./BetRow";
import { getAllBets } from "../utils/betService";
import { displayCategoryLabel } from "../utils/naming";

const FuturesModal = ({ sport, category, market, deleteMode }) => {
  const [data, setData] = useState([]);
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [activeCategory, setActiveCategory] = useState(category || "All");
  useEffect(() => {
    setActiveCategory(category || "All");
  }, [category]);

  // Fetch bets for sport
  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getAllBets();
        let sportBets = [];
        if (result && result[sport]) {
          Object.values(result[sport]).forEach((arr) => {
            sportBets = sportBets.concat(arr);
          });
        }
        setData(
          sportBets.map((b) => {
            // Extract market value from details for older bets that don't have market field
            let market = b.market ?? b.subtype ?? "";
            if (!market && b.details) {
              // For older bets, extract market from details
              market = b.details.bet || b.details.stat || b.details.award || "";
            }

            return {
              ...b,
              sport: b.sport ?? b.league,
              category: b.category ?? b.type ?? b.tabLabel ?? "All",
              market: market,
              odds_american: b.odds_american ?? b.odds ?? "",
            };
          })
        );
      } catch (error) {
        console.error("Error fetching bets:", error);
      }
    };
    fetchData();

    const updateListener = () => fetchData();
    window.addEventListener("betsUpdated", updateListener);
    return () => window.removeEventListener("betsUpdated", updateListener);
  }, [sport]);

  useEffect(() => {
    const el = document.getElementById("futures-modal");
    if (el) {
      el.setAttribute("data-active-category", activeCategory);
    }
  }, [activeCategory]);

  const handleTabChange = (cat) => {
    setActiveCategory(cat);
    const nextParams = new URLSearchParams(params);
    nextParams.set("sport", sport);
    nextParams.set("category", cat);
    nextParams.delete("market");
    navigate(`?${nextParams.toString()}`, { replace: true });
  };

  const filtered = data.filter((b) => {
    const catOk =
      activeCategory === "All"
        ? true
        : String(b.category).toLowerCase() === activeCategory.toLowerCase();
    const marketOk = !market
      ? true
      : String(b.market || "").toLowerCase() === String(market).toLowerCase();
    return catOk && marketOk;
  });

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
          {["All", "Awards", "Team Futures", "Stat Leaders", "Props"].map(
            (cat) => (
              <button
                key={cat}
                onClick={() => handleTabChange(cat)}
                className={`py-2 text-sm font-medium rounded-lg transition-colors px-2.5 sm:px-4 min-w-[116px] text-center ${
                  activeCategory === cat
                    ? "bg-neutral-500 text-neutral-900 shadow-lg text-white border-neutral-300"
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
                }`}
              >
                <span>{displayCategoryLabel(cat)}</span>
              </button>
            )
          )}
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
