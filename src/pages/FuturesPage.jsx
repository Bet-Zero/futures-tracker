// src/pages/FuturesPage.jsx

import React, { useState } from "react";
import FuturesModal from "../components/FuturesModal";
import AddBetModal from "../components/AddBetModal";

const FuturesPage = () => {
  const [showAdd, setShowAdd] = useState(false);
  const [sport, setSport] = useState("NFL");

  return (
    <div className="relative">
      <div className="absolute top-0 left-0 m-4 flex gap-2">
        {['NFL', 'NBA', 'MLB'].map((lg) => (
          <button
            key={lg}
            onClick={() => setSport(lg)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${sport === lg ? 'bg-neutral-200 text-neutral-900' : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white'}`}
          >
            {lg}
          </button>
        ))}
      </div>
      <button
        onClick={() => setShowAdd(true)}
        className="absolute top-0 right-0 m-4 text-3xl text-white w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700"
        aria-label="Add Bet"
      >
        +
      </button>
      <FuturesModal sport={sport} />
      {showAdd && <AddBetModal onClose={() => setShowAdd(false)} />}
    </div>
  );
};

export default FuturesPage;
