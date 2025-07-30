import React, { useState } from "react";

const AddBetPage = () => {
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
      if (!res.ok) {
        throw new Error("Request failed");
      }
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
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <form onSubmit={handleSubmit} className="space-y-3 w-full max-w-md bg-neutral-900 p-6 rounded">
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
  );
};

export default AddBetPage;
