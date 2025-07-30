import React, { useState } from "react";

import { nflLogoMap, nbaLogoMap, mlbLogoMap } from "../utils/logoMap";

const teamsByLeague = {
  NBA: Object.keys(nbaLogoMap).filter((t) => t !== "NBA"),
  NFL: Object.keys(nflLogoMap).filter((t) => t !== "NFL"),
  MLB: Object.keys(mlbLogoMap).filter((t) => t !== "MLB"),
  PGA: [],
  CFL: [],
};

const AddBetModal = ({ onClose }) => {
  const [form, setForm] = useState({
    site: "FD",
    league: "NBA",
    team: "",
    player: "",
    type: "",
    ou: "Over",
    line: "",
    odds: "",
  });

  const [message, setMessage] = useState("");

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
    try {
      const submitDate = new Date().toISOString().split("T")[0];
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, date: submitDate }),
      });
      if (!res.ok) throw new Error("Request failed");
      setForm({
        site: "FD",
        league: "NBA",
        team: "",
        player: "",
        type: "",
        ou: "Over",
        line: "",
        odds: "",
      });
      setMessage("Bet saved!");
    } catch {
      setMessage("Error saving bet.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-neutral-900 w-full max-w-[560px] p-6 rounded-xl space-y-4 text-white">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Add Bet</h2>
            <select
              name="site"
              value={form.site}
              onChange={handleChange}
              className="p-1 bg-neutral-800 rounded"
            >
              {["FD", "DK", "MG", "CAESARS"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              name="league"
              value={form.league}
              onChange={handleChange}
              className="p-1 bg-neutral-800 rounded"
            >
              {["NBA", "NFL", "MLB", "PGA", "CFL"].map((lg) => (
                <option key={lg} value={lg}>
                  {lg}
                </option>
              ))}
            </select>
          </div>
          <button onClick={onClose} className="text-xl leading-none">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Team + Player */}
          <div className="flex gap-2">
            <select
              name="team"
              value={form.team}
              onChange={handleChange}
              className="flex-1 p-2 bg-neutral-800 rounded"
            >
              <option value="">Team</option>
              {(teamsByLeague[form.league] || []).map((team) => (
                <option key={team} value={team}>
                  {team}
                </option>
              ))}
            </select>

            <input
              type="text"
              name="player"
              placeholder="Player"
              value={form.player}
              onChange={handleChange}
              className="flex-1 p-2 bg-neutral-800 rounded"
            />
          </div>

          {/* Type + O/U + Line + Odds */}
          <div className="flex gap-2">
            <input
              type="text"
              name="type"
              placeholder="Type (e.g. 3pt, Assists)"
              value={form.type}
              onChange={handleChange}
              className="flex-grow p-2 bg-neutral-800 rounded"
              required
            />

            <select
              name="ou"
              value={form.ou}
              onChange={handleChange}
              className="w-20 p-2 bg-neutral-800 rounded"
            >
              {["Over", "Under"].map((val) => (
                <option key={val} value={val}>
                  {val}
                </option>
              ))}
            </select>

            <input
              type="text"
              name="line"
              placeholder="Line (e.g. 5.5 or 10+)"
              value={form.line}
              onChange={handleChange}
              className="w-20 p-2 bg-neutral-800 rounded"
            />

            <input
              type="text"
              name="odds"
              placeholder="Odds (e.g. +270)"
              value={form.odds}
              onChange={handleChange}
              className="w-20 p-2 bg-neutral-800 rounded"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-white text-black py-2 rounded"
          >
            Submit
          </button>

          {message && <p className="text-center text-sm">{message}</p>}
        </form>
      </div>
    </div>
  );
};

export default AddBetModal;
