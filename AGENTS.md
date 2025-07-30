# 🤖 AGENTS.md

## 🔧 Codex Agent Instructions

This project uses a simple Vite + React + Tailwind setup.

You can assume:

- No routing alias (use relative paths)
- No backend yet (data is imported from a local file)
- Goal is **screenshot-ready display of sports bets**, centered like a modal

---

## 🛠️ When Modifying This Project

**DO:**

- Keep the layout compact (max `w-[600px]`)
- Use Tailwind for all styling
- Maintain clean separation of components
- Keep everything inside `src/` folder
- If new UI needs data, extend `futuresData.js`

**DON’T:**

- Introduce complex state management (no Redux or Context)
- Add backend integrations unless explicitly asked
- Modify layout to full-page scroll — this is modal-style

---

## 🤖 Example Tasks Codex Can Handle

- Add a new tab for a bet type
- Add a form for submitting new bets
- Convert dropdown to segmented buttons
- Style the modal with better hover/focus states
- Add an export-to-image button (e.g. using html-to-image)

---

## 🔄 Data Format (futuresData.js)

```js
{
  type: "Props",
  category: "Pass Yds",
  label: "Matthew Stafford",
  rightText: "o3825.5",
  starred: true
}
```
