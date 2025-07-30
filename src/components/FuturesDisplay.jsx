// src/components/FuturesDisplay.jsx

import React from "react";

const SectionTitle = ({ title }) => (
  <h2 className="text-2xl font-extrabold border-b border-white/10 pb-1 mb-4 mt-10">
    {title}
  </h2>
);

const SubsectionTitle = ({ title }) => (
  <h3 className="text-lg font-semibold text-white/80 mt-4 mb-2">{title}</h3>
);

const BetRow = ({ label, rightText, starred }) => (
  <div className="flex justify-between items-center px-3 py-[6px] rounded hover:bg-white/5 transition">
    <span
      className={`text-sm ${
        starred ? "font-bold italic text-yellow-300" : "text-white"
      }`}
    >
      {starred && "⭐ "} {label}
    </span>
    <span className="text-sm text-gray-400">{rightText}</span>
  </div>
);

const FuturesDisplay = ({ data }) => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      {Object.entries(data).map(([sectionKey, sectionValue]) => (
        <div key={sectionKey} className="mb-10">
          <SectionTitle title={sectionKey} />

          {Array.isArray(sectionValue) ? (
            <div className="space-y-1">
              {sectionValue.map((item, idx) => (
                <BetRow
                  key={idx}
                  label={item.player || item.team}
                  rightText={item.odds || item.bet}
                  starred={item.starred}
                />
              ))}
            </div>
          ) : (
            Object.entries(sectionValue).map(([subKey, subList]) => (
              <div key={subKey} className="mb-4">
                <SubsectionTitle title={subKey} />
                <div className="space-y-1">
                  {subList.map((item, idx) => (
                    <BetRow
                      key={idx}
                      label={item.player || item.team}
                      rightText={item.odds || item.bet}
                      starred={item.starred}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );
};

export default FuturesDisplay;
