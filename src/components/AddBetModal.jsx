import React, { useState } from "react";

const AddBetModal = ({ onClose }) => {
  const [form, setForm] = useState({
    league: "NBA",
    subjectType: "Team",
    subject: "",
    bet: "",
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
        league: "NBA",
        subjectType: "Team",
        subject: "",
        bet: "",
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
      <div className="bg-neutral-900 w-full max-w-md p-6 rounded-xl space-y-3 text-white">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Add Bet</h2>
          <button onClick={onClose} className="text-xl leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <select
            className="w-full p-2 bg-neutral-800 rounded"
            name="league"
            value={form.league}
            onChange={handleChange}
          >
            {['NBA', 'NFL', 'MLB', 'PGA', 'CFL'].map((lg) => (
              <option key={lg} value={lg}>
                {lg}
              </option>
            ))}
          </select>
          <select
            className="w-full p-2 bg-neutral-800 rounded"
            name="subjectType"
            value={form.subjectType}
            onChange={handleChange}
          >
            {['Team', 'Player'].map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
          <input
            className="w-full p-2 bg-neutral-800 rounded"
            placeholder="Subject"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            required
          />
          <input
            className="w-full p-2 bg-neutral-800 rounded"
            placeholder="Bet description"
            name="bet"
            value={form.bet}
            onChange={handleChange}
            required
          />
          <input
            className="w-full p-2 bg-neutral-800 rounded"
            placeholder="Line (optional)"
            name="line"
            value={form.line}
            onChange={handleChange}
          />
          <input
            className="w-full p-2 bg-neutral-800 rounded"
            placeholder="Odds"
            name="odds"
            value={form.odds}
            onChange={handleChange}
            required
          />
          <button type="submit" className="w-full bg-white text-black py-2 rounded">
            Submit
          </button>
          {message && <p className="text-center text-sm">{message}</p>}
        </form>
      </div>
    </div>
  );
};

export default AddBetModal;
