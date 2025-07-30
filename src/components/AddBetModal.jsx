import React, { useState } from "react";

const AddBetModal = ({ onClose }) => {
  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    date: today,
    site: "FD",
    sport: "NBA",
    name: "",
    type: "",
    ou: "Over",
    line: "",
    odds: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Request failed");
      setForm({
        date: today,
        site: "FD",
        sport: "NBA",
        name: "",
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
      <div className="bg-neutral-900 w-full max-w-md p-6 rounded-xl space-y-4 text-white">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Add Bet</h2>
          <button onClick={onClose} className="text-xl leading-none">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <input
            type="date"
            name="date"
            value={form.date}
            onChange={handleChange}
            className="w-full p-2 bg-neutral-800 rounded"
          />

          {/* Site + Sport */}
          <div className="flex gap-2">
            <select
              name="site"
              value={form.site}
              onChange={handleChange}
              className="w-1/2 p-2 bg-neutral-800 rounded"
            >
              {["FD", "DK", "MG", "CAESARS"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              name="sport"
              value={form.sport}
              onChange={handleChange}
              className="w-1/2 p-2 bg-neutral-800 rounded"
            >
              {["NBA", "NFL", "MLB", "PGA", "CFL"].map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>
          </div>

          {/* Player/Team + Type */}
          <div className="flex gap-2">
            <input
              type="text"
              name="name"
              placeholder="Player or Team"
              value={form.name}
              onChange={handleChange}
              className="w-1/2 p-2 bg-neutral-800 rounded"
              required
            />
            <input
              type="text"
              name="type"
              placeholder="Type (e.g. 3pt, Assists)"
              value={form.type}
              onChange={handleChange}
              className="w-1/2 p-2 bg-neutral-800 rounded"
              required
            />
          </div>

          {/* O/U + Line + Odds */}
          <div className="flex gap-2">
            <select
              name="ou"
              value={form.ou}
              onChange={handleChange}
              className="w-1/3 p-2 bg-neutral-800 rounded"
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
              className="w-1/3 p-2 bg-neutral-800 rounded"
            />

            <input
              type="text"
              name="odds"
              placeholder="Odds (e.g. +270)"
              value={form.odds}
              onChange={handleChange}
              className="w-1/3 p-2 bg-neutral-800 rounded"
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
