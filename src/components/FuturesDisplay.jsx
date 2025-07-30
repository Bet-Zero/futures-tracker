// src/components/FuturesDisplay.jsx

import React from "react";

const SectionTitle = ({ title }) => (
  <h2 className="text-xl font-bold text-white mb-6 pb-3 border-b border-neutral-700">
    {title}
  </h2>
);

const SubsectionTitle = ({ title }) => (
  <h3 className="text-base font-semibold text-neutral-300 mb-4 mt-6">
    {title}
  </h3>
);

const BetRow = ({ label, lineText, oddsText, rightText, tag }) => (
  <div className="flex items-center justify-between px-3 py-2 rounded bg-neutral-800/30 hover:bg-neutral-800/50 transition-colors">
    <div className="flex-1 flex items-center gap-2">
      <span className="text-white text-sm font-medium">{label}</span>
      {tag && (
        <span className="bg-neutral-700 px-2 py-0.5 rounded text-xs font-medium text-neutral-200">
          {tag}
        </span>
      )}
    </div>

    <div className="flex items-center gap-3">
      {lineText && oddsText ? (
        <>
          <span className="bg-neutral-700 px-2 py-0.5 rounded text-xs font-medium text-neutral-200">
            {lineText}
          </span>
          <span className="text-green-400 font-semibold text-sm min-w-[50px] text-right">
            {oddsText}
          </span>
        </>
      ) : (
        <span className="text-green-400 font-semibold text-sm">
          {rightText}
        </span>
      )}
    </div>
  </div>
);

const FuturesDisplay = ({ data }) => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      {Object.entries(data).map(([sectionKey, sectionValue]) => (
        <div key={sectionKey} className="mb-12">
          <SectionTitle title={sectionKey} />

          {Array.isArray(sectionValue) ? (
            <div className="space-y-1.5">
              {sectionValue.map((item, idx) => {
                const hasProps = item.line && item.odds;
                const lineText = hasProps
                  ? `${item.ou || "o"}${item.line}`
                  : null;
                const oddsText = hasProps ? item.odds : null;
                const rightText = hasProps ? null : item.odds || item.bet;
                const tag = !hasProps ? item.category : null;
                return (
                  <BetRow
                    key={idx}
                    label={item.label || item.player || item.team}
                    lineText={lineText}
                    oddsText={oddsText}
                    rightText={rightText}
                    tag={tag}
                  />
                );
              })}
            </div>
          ) : (
            Object.entries(sectionValue).map(([subKey, subList]) => (
              <div key={subKey} className="mb-8">
                <SubsectionTitle title={subKey} />
                <div className="space-y-1.5">
                  {subList.map((item, idx) => {
                    const hasProps = item.line && item.odds;
                    const lineText = hasProps
                      ? `${item.ou || "o"}${item.line}`
                      : null;
                    const oddsText = hasProps ? item.odds : null;
                    const rightText = hasProps ? null : item.odds || item.bet;
                    const tag = !hasProps ? item.category : null;
                    return (
                      <BetRow
                        key={idx}
                        label={item.label || item.player || item.team}
                        lineText={lineText}
                        oddsText={oddsText}
                        rightText={rightText}
                        tag={tag}
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
