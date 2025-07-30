// src/pages/FuturesPage.jsx

import React, { useState } from "react";
import FuturesModal from "../components/FuturesModal";
import AddBetModal from "../components/AddBetModal";

const FuturesPage = () => {
  const [showAdd, setShowAdd] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setShowAdd(true)}
        className="absolute top-0 right-0 m-4 text-3xl text-white w-8 h-8 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700"
        aria-label="Add Bet"
      >
        +
      </button>
      <FuturesModal />
      {showAdd && <AddBetModal onClose={() => setShowAdd(false)} />}
    </div>
  );
};

export default FuturesPage;
