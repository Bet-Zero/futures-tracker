// src/pages/FuturesPage.jsx

import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import FuturesModal from "../components/FuturesModal";
import AddBetModal from "../components/AddBetModal";

const FuturesPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);

  const sportParam = params.get("sport");
  const sport = sportParam || "NFL";

  const handleSportChange = (newSport) => {
    const newParams = new URLSearchParams(params);
    newParams.set("sport", newSport);
    newParams.set("type", "All");
    newParams.set("category", "All");
    newParams.set("group", "All");
    navigate(`?${newParams.toString()}`);
  };

  const handleShare = async () => {
    const node = document.getElementById("futures-modal");
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(node, { pixelRatio: 2 });
    const { uploadImageToDiscord } = await import(
      "../utils/uploadToDiscord.js"
    );
    await uploadImageToDiscord(dataUrl, "Futures");
    alert("Shared to Discord");
  };

  const hasSportParam = Boolean(sportParam);

  return (
    <div
      id={!hasSportParam ? "home-screen" : undefined}
      className="space-y-4 relative"
    >
      {/* Header */}
      <div className="flex items-center justify-between max-w-2xl mx-auto px-4">
        <div className="flex gap-1.5">
          {["NFL", "NBA", "MLB"].map((lg) => (
            <button
              key={lg}
              onClick={() => handleSportChange(lg)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                sport === lg
                  ? "bg-neutral-200 text-neutral-900"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
              }`}
            >
              {lg}
            </button>
          ))}
        </div>

        {/* Add Bet Button */}
        <button
          onClick={() => setShowAdd(true)}
          className="text-2xl -mb-2 text-white w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700"
          aria-label="Add Bet"
        >
          +
        </button>
      </div>

      {/* Modal UI */}
      <FuturesModal sport={sport} />
      {showAdd && <AddBetModal onClose={() => setShowAdd(false)} />}

      {/* Floating Share Button */}
      <button
        onClick={handleShare}
        className="fixed bottom-6 right-6 px-4 py-2 text-sm font-semibold rounded-full bg-neutral-700 hover:bg-neutral-500 shadow-lg text-white z-50"
      >
        Share
      </button>
    </div>
  );
};

export default FuturesPage;
