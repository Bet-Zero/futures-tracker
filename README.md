# 🧠 Futures Tracker

A clean, centered, screenshot-ready React + Tailwind web app for tracking sports futures bets.

Built for sharing plays on Discord, Instagram, etc.  
Designed with modal-style layout, filterable tabs, and clean exportable views.

---

## 💻 Tech Stack

- [Vite](https://vitejs.dev/)
- [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- Local JSON data (no backend yet)

---

## 🚀 Usage

```bash
npm install
npm run dev
```

````

Then visit: [http://localhost:5173/futures](http://localhost:5173/futures)

---

## 🗂️ Project Structure

```
src/
├── components/
│   └── FuturesModal.jsx     // Main UI with tabs and dropdown
├── pages/
│   └── FuturesPage.jsx      // Mountable route page
├── data/
│   └── futuresData.js       // Refactored flat array of bet data
```

---

## 📌 Next Features

- [x] Add bet form input UI via + button modal
- [ ] LocalStorage or Firebase save
- [ ] Export to image (for sharing)
- [ ] Discord bot integration (`/bzero` commands)
````
