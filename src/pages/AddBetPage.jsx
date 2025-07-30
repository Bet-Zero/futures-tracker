import React, { useState } from "react";

const AddBetPage = () => {
  const [form, setForm] = useState({
    league: "",
    subject: "",
    info: "",
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
      setForm({ league: "", subject: "", info: "", odds: "" });
      setMessage("Bet saved!");
    } catch {
      setMessage("Error saving bet.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white p-4">
      <form onSubmit={handleSubmit} className="space-y-3 w-full max-w-md bg-neutral-900 p-6 rounded">
        <input
          className="w-full p-2 bg-neutral-800 rounded"
          placeholder="League"
          name="league"
          value={form.league}
          onChange={handleChange}
          required
        />
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
          placeholder="Bet info"
          name="info"
          value={form.info}
          onChange={handleChange}
          required
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
