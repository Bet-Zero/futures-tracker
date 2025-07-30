// src/pages/FuturesPage.jsx

import React, { useState } from "react";
import FuturesModal from "../components/FuturesModal";
import AddBetModal from "../components/AddBetModal";

const FuturesPage = () => {
  const [showAdd, setShowAdd] = useState(false);
  const [sport, setSport] = useState("NFL");

  return (
    <div className="space-y-4 relative">
      <div className="flex items-start justify-between">
        <div className="flex gap-2">
          {['NFL', 'NBA', 'MLB'].map((lg) => (
            <button
              key={lg}
              onClick={() => setSport(lg)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${sport === lg ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'}`}
            >
              {lg}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="text-3xl text-white w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700"
          aria-label="Add Bet"
        >
          +
        </button>
      </div>
      <FuturesModal sport={sport} />
      {showAdd && <AddBetModal onClose={() => setShowAdd(false)} />}
    </div>
  );
};

export default FuturesPage;
