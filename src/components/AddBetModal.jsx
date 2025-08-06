import React, { useState } from "react";
import playerTeamMap from "../data/playerTeamMap";

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

const TYPE_OPTIONS = ["Futures", "Awards", "Props", "Leaders"];
const CATEGORY_BY_TYPE = {
  Futures: [
    "Super Bowl",
    "Conference",
    "Division",
    "Win Total",
    "Make Playoffs",
  ],
  Awards: ["MVP", "DPOY", "ROY", "COY"],
  Props: ["Pass Yds", "Rush Yds", "Rec Yds", "Home Runs", "Points"],
  Leaders: ["Pass Yds", "Rush TD", "Rec Yds"],
};
const GROUP_OPTIONS = ["To Win", "Win Totals", "Playoffs"];

const initialForm = {
  site: "FD",
  league: "NBA",
  team: "",
  player: "",
  type: "",
  category: "",
  group: "",
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
      return;
    }

    if (name === "player") {
      const key = value.trim().toLowerCase();
      const mappedTeam = playerTeamMap[key];
      if (mappedTeam) {
        const league = Object.keys(teamsByLeague).find((lg) =>
          teamsByLeague[lg].includes(mappedTeam)
        );
        setForm({
          ...form,
          player: value,
          team: mappedTeam,
          league: league || form.league,
        });
        return;
      }
    }

    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsError(false);
    const playerKey = form.player.trim().toLowerCase();
    const teamName = form.team || playerTeamMap[playerKey] || "";

      try {
        const res = await fetch("/api/bets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, team: teamName }),
        });

        if (!res.ok) throw new Error("Request failed");

        if (playerKey && teamName) {
          playerTeamMap[playerKey] = teamName;
        }

        setForm(initialForm);
        setMessage("Bet saved!");
        window.dispatchEvent(new Event("betsUpdated"));
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
              list="typeOptions"
              value={form.type}
              onChange={handleChange}
              className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg"
              required
            />
            <datalist id="typeOptions">
              {TYPE_OPTIONS.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Category
            </label>
            <input
              type="text"
              name="category"
              list="categoryOptions"
              value={form.category}
              onChange={handleChange}
              className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg"
            />
            <datalist id="categoryOptions">
              {(CATEGORY_BY_TYPE[form.type] || []).map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </div>

          {/* Group (optional) */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Group (optional)
            </label>
            <input
              type="text"
              name="group"
              list="groupOptions"
              value={form.group}
              onChange={handleChange}
              className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg"
            />
            <datalist id="groupOptions">
              {GROUP_OPTIONS.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
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
