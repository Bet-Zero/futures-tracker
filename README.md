Here’s an updated and comprehensive `README.md` based on your full codebase structure, backend functionality, and Discord bot integration:

---

````markdown
# 🧠 Futures Tracker

A clean, compact, screenshot-ready web app for tracking and sharing sports futures bets.

Built with **React**, **Tailwind**, and **Discord bot integration**, it supports:

- Viewing and filtering NFL, NBA, and MLB bets
- Submitting new bets via a styled modal or standalone form
- Exporting and sharing bet screenshots to Discord via Puppeteer
- Organized for easy extension and automation

---

## 🚀 Quick Start

Install dependencies and start the app and bot together:

```bash
npm install
npm run dev
```
````

> 🔧 This runs both the frontend and the bot upload server concurrently.

Frontend: [http://localhost:5173/futures](http://localhost:5173/futures)
Upload server: [http://localhost:3002](http://localhost:3002)

---

## 🛠️ Features

✅ Modal-based bet tracker
✅ Responsive layout for screenshots
✅ Screenshot export via Puppeteer
✅ Discord slash command integration
✅ Auto-upload to Discord channel
✅ Supports NFL, NBA, MLB, PGA, CFL
✅ Local JSON bet saving (server + UI)
🔜 Firebase or LocalStorage integration
🔜 User accounts or auth
🔜 Bet editing and deletion

---

## 📦 Tech Stack

- [Vite](https://vitejs.dev/) + [React](https://reactjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Puppeteer](https://pptr.dev/) for screenshot capture
- [Discord.js v14](https://discord.js.org/)
- [Express](https://expressjs.com/) for simple API and image upload
- Local JSON as a lightweight backend substitute

---

## 📂 Project Structure

```
├── public/                     # Static assets
├── src/
│   ├── assets/                # Logo and image assets
│   ├── components/            # UI components (modals, display)
│   ├── data/                  # Local bet data by league
│   ├── pages/                 # Page-level components
│   ├── utils/                 # Upload & logo mapping utilities
│   ├── App.jsx                # Router setup
│   └── main.jsx               # App entry point
├── bot/                       # Discord bot + Puppeteer screenshot server
│   ├── scripts/               # Slash command registration
│   ├── server.js              # Upload API + bot listener
│   └── package.json           # Bot dependencies
├── bets.json                  # Local saved bets
├── server.js                  # Express API for bet POST/GET
├── .env                       # Discord bot token + channel ID
├── vite.config.js             # Vite server + proxy
├── AGENTS.md                  # Codex instructions
└── README.md                  # This file
```

---

## 🤖 Discord Bot Setup

Add a `.env` file inside the `bot/` folder:

```
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_discord_app_client_id
CHANNEL_ID=optional_channel_id_to_upload_images
```

Register slash commands:

```bash
npm run register
```

Use `/futures` to trigger screenshot upload via Puppeteer.

---

## 🧪 Development Tips

- The modal layout is intentionally capped in width for clean screenshots
- Screenshots only begin after filters are applied (`#home-screen` disappears)
- Add new bet types or groups in `src/data/futuresData.js`
- To export images directly from UI: click **"Share"** in the top bar

---

## 🔮 Example Bet Format

```js
{
  type: "Props",
  category: "Pass Yds",
  label: "Matthew Stafford",
  rightText: "o3825.5",
  line: 3825.5,
  odds: "-110",
  ou: "o",
  starred: true
}
```

---

## ✨ Roadmap

- [x] Modal UI with form inputs
- [x] Share to Discord via screenshot
- [x] AddBetPage route with POST handling
- [ ] Firebase or localStorage persistence
- [ ] Visual themes by sportsbook or league
- [ ] Filter chips for team/player/position

---

## 🧠 Built For

- **Sports bettors** who want to organize and share their plays
- **Discord sharers** who want instant screenshots from `/slash` commands
- **Creators** who want clean betting content for Instagram/X

---

## 🧼 Credits

Built using Vite + React + Tailwind + Discord.js
Puppeteer powered screenshots

---

```

```
