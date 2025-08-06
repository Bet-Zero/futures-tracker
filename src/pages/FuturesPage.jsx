// src/pages/FuturesPage.jsx

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import FuturesModal from "../components/FuturesModal";
import AddBetModal from "../components/AddBetModal";

const FuturesPage = () => {
  const [showAdd, setShowAdd] = useState(false);
  const [sport, setSport] = useState("NFL");
  const [params] = useSearchParams();

  // Initialize from query param if present
  useEffect(() => {
    const sportParam = params.get("sport");
    if (sportParam) setSport(sportParam);
  }, [params]);

  // Only show the #home-screen wrapper when there is no sport query
  const hasSportParam = Boolean(params.get("sport"));

  return (
    <div id={!hasSportParam ? "home-screen" : undefined} className="space-y-4">
      <div className="flex items-center justify-between max-w-2xl mx-auto px-4">
        <div className="flex gap-1.5">
          {["NFL", "NBA", "MLB"].map((lg) => (
            <button
              key={lg}
              onClick={() => setSport(lg)}
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
        <button
          onClick={() => setShowAdd(true)}
          className="text-2xl -mb-2 text-white w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700"
          aria-label="Add Bet"
        >
          +
        </button>
        <button
          onClick={async () => {
            const node = document.getElementById("futures-modal");
            const { toPng } = await import("html-to-image");
            const dataUrl = await toPng(node, { pixelRatio: 2 });
            const { uploadImageToDiscord } = await import(
              "../utils/uploadToDiscord.js"
            );
            await uploadImageToDiscord(dataUrl, "Futures");
            alert("Shared to Discord");
          }}
          className="px-3 py-1.5 text-sm bg-neutral-800 hover:bg-neutral-700 rounded-lg"
        >
          Share
        </button>
      </div>

      <FuturesModal sport={sport} />
      {showAdd && <AddBetModal onClose={() => setShowAdd(false)} />}
    </div>
  );
};

export default FuturesPage;
