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

const TAB_LABELS = {
  Prop: "Props",
  "Player Award": "Player Awards",
  "Team Bet": "Team Bets",
  "Stat Leader": "Stat Leaders",
};

const TYPE_OPTIONS = Object.keys(TAB_LABELS);

const TEAM_BET_SUBTYPES = [
  { value: "Win Total", label: "Win Total" },
  { value: "Super Bowl", label: "Super Bowl Winner" },
  { value: "Division Winner", label: "Division Winner" },
  { value: "Conference Winner", label: "Conference Winner" },
  { value: "Playoffs", label: "Make Playoffs" },
];

const initialForm = {
  site: "FD",
  league: "NBA",
  type: "Prop",
  player: "",
  team: "",
  odds: "",
  award: "",
  bet: "Win Total",
  betSubtype: "Win Total",
  value: "",
  stat: "",
  ou: "Over",
  line: "",
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

    if (name === "type") {
      setForm({ ...form, type: value });
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

    const details = {};
    if (form.type === "Player Award") details.award = form.award;
    if (form.type === "Team Bet") {
      details.bet = form.betSubtype;
      if (form.betSubtype === "Win Total") {
        details.value = form.value;
        details.ou = form.ou;
      }
    }
    if (form.type === "Stat Leader") details.stat = form.stat;
    if (form.type === "Prop") {
      details.stat = form.stat;
      details.ou = form.ou;
      details.line = form.line;
    }

    try {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: form.type,
          tabLabel: TAB_LABELS[form.type],
          player: form.type === "Team Bet" ? null : form.player,
          team: teamName,
          image: "",
          details,
          odds: form.odds,
          site: form.site,
          league: form.league,
        }),
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

  // Render the form fields based on the bet type
  const renderDynamicFields = () => {
    switch (form.type) {
      case "Player Award":
        return (
          <div className="space-y-4">
            {/* Player/Team group */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Player
                </label>
                <input
                  type="text"
                  name="player"
                  placeholder="Enter player name"
                  value={form.player}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Team
                </label>
                <input
                  type="text"
                  name="team"
                  placeholder="Enter team"
                  value={form.team}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Award and Odds */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Award
                </label>
                <input
                  type="text"
                  name="award"
                  value={form.award}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                  required
                />
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Odds
                </label>
                <input
                  type="text"
                  name="odds"
                  value={form.odds}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-right"
                  required
                />
              </div>
            </div>
          </div>
        );

      case "Team Bet":
        return (
          <div className="space-y-4">
            {/* Team */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Team
              </label>
              <input
                type="text"
                name="team"
                placeholder="Enter team"
                value={form.team}
                onChange={handleChange}
                className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                required
              />
            </div>

            {/* Bet Type */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Bet Type
              </label>
              <select
                name="betSubtype"
                value={form.betSubtype}
                onChange={handleChange}
                className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                required
              >
                {TEAM_BET_SUBTYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Win Total specific fields */}
            {form.betSubtype === "Win Total" && (
              <div className="flex gap-2 items-end">
                <div className="w-20">
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    O/U
                  </label>
                  <select
                    name="ou"
                    value={form.ou}
                    onChange={handleChange}
                    className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                    required
                  >
                    <option value="Over">Over</option>
                    <option value="Under">Under</option>
                  </select>
                </div>
                <div className="w-20">
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Value
                  </label>
                  <input
                    type="text"
                    name="value"
                    value={form.value}
                    onChange={handleChange}
                    className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-right"
                    required
                  />
                </div>
                <div className="w-20">
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Odds
                  </label>
                  <input
                    type="text"
                    name="odds"
                    value={form.odds}
                    onChange={handleChange}
                    className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-right"
                    required
                  />
                </div>
              </div>
            )}

            {/* Non-Win Total odds */}
            {form.betSubtype !== "Win Total" && (
              <div className="w-20">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Odds
                </label>
                <input
                  type="text"
                  name="odds"
                  value={form.odds}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-right"
                  required
                />
              </div>
            )}
          </div>
        );
      case "Stat Leader":
        return (
          <div className="space-y-4">
            {/* Player/Team group */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Player
                </label>
                <input
                  type="text"
                  name="player"
                  placeholder="Enter player name"
                  value={form.player}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Team
                </label>
                <input
                  type="text"
                  name="team"
                  placeholder="Enter team"
                  value={form.team}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Stat and Odds */}
            <div className="flex gap-2 items-end">
              <div className="w-32">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Stat
                </label>
                <input
                  type="text"
                  name="stat"
                  value={form.stat}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                  required
                />
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Odds
                </label>
                <input
                  type="text"
                  name="odds"
                  value={form.odds}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-right"
                  required
                />
              </div>
            </div>
          </div>
        );
      case "Prop":
        return (
          <div className="space-y-4">
            {/* Player/Team group */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Player
                </label>
                <input
                  type="text"
                  name="player"
                  placeholder="Enter player name"
                  value={form.player}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                  required
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Team
                </label>
                <input
                  type="text"
                  name="team"
                  placeholder="Enter team"
                  value={form.team}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Bet details group */}
            <div className="flex gap-2 items-end">
              <div className="w-32">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Stat
                </label>
                <input
                  type="text"
                  name="stat"
                  value={form.stat}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                  required
                />
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  O/U
                </label>
                <select
                  name="ou"
                  value={form.ou}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                  required
                >
                  <option value="Over">Over</option>
                  <option value="Under">Under</option>
                </select>
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Line
                </label>
                <input
                  type="text"
                  name="line"
                  value={form.line}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-right"
                  required
                />
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Odds
                </label>
                <input
                  type="text"
                  name="odds"
                  value={form.odds}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-right"
                  required
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 w-full max-w-md rounded-xl text-white">
        <div className="flex flex-col">
          {/* Header with League Selection */}
          <div className="px-4 py-3 border-b border-neutral-800">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Add Bet</h2>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-white text-xl leading-none transition-colors"
              >
                ✕
              </button>
            </div>

            {/* League Toggle Buttons */}
            <div className="flex gap-1.5">
              {["NFL", "NBA", "MLB"].map((lg) => (
                <button
                  key={lg}
                  onClick={() =>
                    handleChange({ target: { name: "league", value: lg } })
                  }
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    form.league === lg
                      ? "bg-neutral-200 text-neutral-900"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
                  }`}
                >
                  {lg}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <form className="space-y-4">
              {/* Bet Type Selection */}
              <div>
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Type
                </label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                >
                  {TYPE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic fields based on bet type */}
              {renderDynamicFields()}
            </form>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-neutral-800">
            {message && (
              <p
                className={`text-center text-xs mb-2 ${
                  isError ? "text-red-400" : "text-green-400"
                }`}
              >
                {message}
              </p>
            )}
            <div className="flex gap-2 items-center">
              <select
                name="site"
                value={form.site}
                onChange={handleChange}
                className="w-24 p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-xs"
              >
                {["FD", "DK", "MG", "CAESARS"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                onClick={handleSubmit}
                className="flex-1 bg-neutral-700 hover:bg-neutral-600 text-white py-2 rounded-lg font-semibold transition-colors text-sm"
              >
                Add Bet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBetModal;
