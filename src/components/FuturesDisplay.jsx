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

const BetRow = ({ label, lineText, oddsText, rightText }) => (
  <div className="flex justify-between items-center px-3 py-[6px] rounded hover:bg-white/5 transition">
    <span className="text-sm text-white">{label}</span>
    {lineText && oddsText ? (
      <span className="text-sm">
        <span className="text-gray-200 mr-2">{lineText}</span>
        <span className="text-gray-400">{oddsText}</span>
      </span>
    ) : (
      <span className="text-sm text-gray-400">{rightText}</span>
    )}
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
              {sectionValue.map((item, idx) => {
                const hasProps = item.line && item.odds;
                const lineText = hasProps ? `${item.ou || "o"}${item.line}` : null;
                const oddsText = hasProps ? item.odds : null;
                const rightText = hasProps ? null : item.odds || item.bet;
                return (
                  <BetRow
                    key={idx}
                    label={item.player || item.team}
                    lineText={lineText}
                    oddsText={oddsText}
                    rightText={rightText}
                  />
                );
              })}
            </div>
          ) : (
            Object.entries(sectionValue).map(([subKey, subList]) => (
              <div key={subKey} className="mb-4">
                <SubsectionTitle title={subKey} />
                <div className="space-y-1">
                  {subList.map((item, idx) => {
                    const hasProps = item.line && item.odds;
                    const lineText = hasProps ? `${item.ou || "o"}${item.line}` : null;
                    const oddsText = hasProps ? item.odds : null;
                    const rightText = hasProps ? null : item.odds || item.bet;
                    return (
                      <BetRow
                        key={idx}
                        label={item.player || item.team}
                        lineText={lineText}
                        oddsText={oddsText}
                        rightText={rightText}
                      />
                    );
                  })}
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
