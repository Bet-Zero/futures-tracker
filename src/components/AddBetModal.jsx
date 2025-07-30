import React, { useState } from "react";

const AddBetModal = ({ onClose }) => {
  const [form, setForm] = useState({
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
      const submitDate = new Date().toISOString().split("T")[0];
      const res = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, date: submitDate }),
      });
      if (!res.ok) throw new Error("Request failed");
      setForm({
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
          {/* Site + Sport + Name */}
          <div className="flex gap-2">
            <select
              name="site"
              value={form.site}
              onChange={handleChange}
              className="w-20 p-2 bg-neutral-800 rounded"
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
              className="w-20 p-2 bg-neutral-800 rounded"
            >
              {["NBA", "NFL", "MLB", "PGA", "CFL"].map((sport) => (
                <option key={sport} value={sport}>
                  {sport}
                </option>
              ))}
            </select>

            <input
              type="text"
              name="name"
              placeholder="Player or Team"
              value={form.name}
              onChange={handleChange}
              className="flex-grow p-2 bg-neutral-800 rounded"
              required
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
