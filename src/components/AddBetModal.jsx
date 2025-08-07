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

const initialForm = {
  site: "FD",
  league: "NBA",
  type: "Prop",
  player: "",
  team: "",
  odds: "",
  award: "",
  bet: "",
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
      details.bet = form.bet;
      if (form.value) details.value = form.value;
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

          {/* Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Type
            </label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
            >
              {TYPE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Player */}
          {form.type !== "Team Bet" && (
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
          )}

          {/* Team */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Team
            </label>
            <input
              type="text"
              name="team"
              placeholder="Enter team"
              value={form.team}
              onChange={handleChange}
              className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg"
            />
          </div>

          {/* Dynamic Fields */}
          {form.type === "Player Award" && (
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                Award
              </label>
              <input
                type="text"
                name="award"
                value={form.award}
                onChange={handleChange}
                className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg"
              />
            </div>
          )}

          {form.type === "Team Bet" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Bet
                </label>
                <input
                  type="text"
                  name="bet"
                  value={form.bet}
                  onChange={handleChange}
                  className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Value
                </label>
                <input
                  type="text"
                  name="value"
                  value={form.value}
                  onChange={handleChange}
                  className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg"
                />
              </div>
            </div>
          )}

          {form.type === "Stat Leader" && (
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                Stat
              </label>
              <input
                type="text"
                name="stat"
                value={form.stat}
                onChange={handleChange}
                className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg"
              />
            </div>
          )}

          {form.type === "Prop" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Stat
                </label>
                <input
                  type="text"
                  name="stat"
                  value={form.stat}
                  onChange={handleChange}
                  className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
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
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                    Line
                  </label>
                  <input
                    type="text"
                    name="line"
                    value={form.line}
                    onChange={handleChange}
                    className="w-full h-12 p-3 bg-neutral-800 border border-neutral-700 rounded-lg"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Odds */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-1.5">
              Odds
            </label>
            <input
              type="text"
              name="odds"
              value={form.odds}
              onChange={handleChange}
              className="w-full p-3 bg-neutral-800 border border-neutral-700 rounded-lg"
              required
            />
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
