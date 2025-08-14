// src/pages/FuturesPage.jsx

import React, { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import FuturesModal from "../components/FuturesModal";
import AddBetModal from "../components/AddBetModal";

const FuturesPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteMode, setDeleteMode] = useState(false);

  const sportParam = params.get("sport");
  const sport = sportParam || "NFL";

  const handleSportChange = (newSport) => {
    const newParams = new URLSearchParams(params);
    newParams.set("sport", newSport);
    newParams.set("tab", "All");
    navigate(`?${newParams.toString()}`);
  };

  const handleShare = async () => {
    try {
      // Get current URL parameters to create a screenshot URL
      const currentUrl = window.location.href;

      // Directly fetch the screenshot from our snap API
      const response = await fetch(
        `/api/snap?url=${encodeURIComponent(currentUrl)}`
      );

      if (!response.ok) {
        throw new Error(`Screenshot failed: ${response.statusText}`);
      }

      // Convert the response to a base64 string
      const blob = await response.blob();
      const reader = new FileReader();

      // Use a promise to handle the async FileReader
      const base64Image = await new Promise((resolve) => {
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });

      // Upload the image to Discord
      const { uploadImageToDiscord } = await import(
        "../utils/uploadToDiscord.js"
      );
      await uploadImageToDiscord(base64Image, "Futures");
      alert("Shared to Discord");
    } catch (error) {
      console.error("Error sharing to Discord:", error);
      alert("Failed to share to Discord");
    }
  };

  const hasSportParam = Boolean(sportParam);

  return (
    <div
      id={!hasSportParam ? "home-screen" : undefined}
      className="space-y-4 relative"
    >
      {/* Header: sport selection and add/remove buttons */}
      <div className="flex items-center justify-between max-w-2xl mx-auto px-4 mb-0 sm:mb-6 fixed top-0 left-0 right-0 z-30 bg-transparent sm:static sm:bg-transparent sm:z-auto sm:top-auto sm:left-auto sm:right-auto mt-6 sm:mt-0 h-[56px]">
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
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowAdd(true)}
            className="text-2xl -mb-2 text-white w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700"
            aria-label="Add Bet"
          >
            +
          </button>
          <button
            onClick={() => setDeleteMode((m) => !m)}
            className={`text-2xl -mb-2 w-8 h-8 flex items-center justify-center rounded-full ${
              deleteMode
                ? "bg-red-700 text-white border border-red-400"
                : "bg-neutral-800 text-neutral-300 hover:bg-red-700 hover:text-white"
            }`}
            aria-label="Remove Bets"
            title={deleteMode ? "Done Removing" : "Remove Bets"}
          >
            -
          </button>
        </div>
      </div>
      {/* Spacer for fixed header on mobile */}
      <div className="block sm:hidden" style={{ height: "32px" }} />
      {/* Modal UI */}
      <div className="sm:mt-0 mt-0">
        <FuturesModal sport={sport} deleteMode={deleteMode} />
      </div>
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
