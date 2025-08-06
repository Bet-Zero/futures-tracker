import React, { useState, useEffect } from "react";

// Mock logo maps for demonstration
const nflLogoMap = {
  NFL: "",
  Patriots: "",
  Cowboys: "",
  "49ers": "",
  Packers: "",
};
const nbaLogoMap = { NBA: "", Lakers: "", Warriors: "", Celtics: "", Heat: "" };
const mlbLogoMap = {
  MLB: "",
  Yankees: "",
  Dodgers: "",
  "Red Sox": "",
  Giants: "",
};

const teamsByLeague = {
  NBA: Object.keys(nbaLogoMap).filter((t) => t !== "NBA"),
  NFL: Object.keys(nflLogoMap).filter((t) => t !== "NFL"),
  MLB: Object.keys(mlbLogoMap).filter((t) => t !== "MLB"),
  PGA: [],
  CFL: [],
};

const initialForm = {
  site: "FD",
  league: "NBA",
  team: "",
  player: "",
  type: "",
  ou: "Over",
  line: "",
  odds: "",
};

const AddBetModal = ({ onClose }) => {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "league") {
      setForm({ ...form, league: value, team: "" });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);
    try {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Request failed");

      setForm(initialForm);
      setMessage("Bet saved!");
    } catch {
      setIsError(true);
      setMessage("Error saving bet.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 w-full max-w-sm p-5 rounded-xl space-y-5 text-white">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Add Bet</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-2xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Sportsbook & League */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                Sportsbook
              </label>
              <select
                name="site"
                value={form.site}
                onChange={handleChange}
                className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
              >
                {["FD", "DK", "MG", "CAESARS"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                League
              </label>
              <select
                name="league"
                value={form.league}
                onChange={handleChange}
                className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
              >
                {["NBA", "NFL", "MLB", "PGA", "CFL"].map((lg) => (
                  <option key={lg} value={lg}>
                    {lg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Team */}
          {teamsByLeague[form.league]?.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                Team
              </label>
              <select
                name="team"
                value={form.team}
                onChange={handleChange}
                className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
              >
                <option value="">Select team...</option>
                {teamsByLeague[form.league].map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Player */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Player
            </label>
            <input
              type="text"
              name="player"
              placeholder="Enter player name"
              value={form.player}
              onChange={handleChange}
              className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg"
            />
          </div>

          {/* Bet Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Bet Type
            </label>
            <input
              type="text"
              name="type"
              placeholder="e.g., Points, Rebounds, 3-Pointers"
              value={form.type}
              onChange={handleChange}
              className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg"
              required
            />
          </div>

          {/* Bet Details */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                O/U
              </label>
              <select
                name="ou"
                value={form.ou}
                onChange={handleChange}
                className="w-full h-12 p-3 bg-neutral-800 border border-neutral-700 rounded-lg"
              >
                <option value="Over">Over</option>
                <option value="Under">Under</option>
              </select>
            </div>

            <div className="col-span-1.5">
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                Line
              </label>
              <input
                type="text"
                name="line"
                placeholder="0.5"
                value={form.line}
                onChange={handleChange}
                className="w-full h-12 p-3 bg-neutral-800 border border-neutral-700 rounded-lg"
              />
            </div>

            <div className="col-span-1.5">
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                Odds
              </label>
              <input
                type="text"
                name="odds"
                placeholder="+110"
                value={form.odds}
                onChange={handleChange}
                className="w-full h-12 p-3 bg-neutral-800 border border-neutral-700 rounded-lg"
                required
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            onClick={handleSubmit}
            className="w-full bg-neutral-700 hover:bg-neutral-600 text-white py-3 rounded-lg font-semibold transition-colors"
          >
            Add Bet
          </button>

          {message && (
            <p
              className={`text-center text-sm ${
                isError ? "text-red-400" : "text-green-400"
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddBetModal;
