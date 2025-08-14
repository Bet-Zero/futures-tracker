import React, { useState } from "react";
import playerTeamMap from "../data/playerTeamMap";
import { nflLogoMap, nbaLogoMap, mlbLogoMap } from "../utils/logoMap";
import * as betService from "../utils/betService";

// Full team name maps
const nflFullNames = {
  "49ers": "San Francisco 49ers",
  Bears: "Chicago Bears",
  Bengals: "Cincinnati Bengals",
  Bills: "Buffalo Bills",
  Broncos: "Denver Broncos",
  Browns: "Cleveland Browns",
  Buccaneers: "Tampa Bay Buccaneers",
  Cardinals: "Arizona Cardinals",
  Chargers: "Los Angeles Chargers",
  Chiefs: "Kansas City Chiefs",
  Colts: "Indianapolis Colts",
  Cowboys: "Dallas Cowboys",
  Dolphins: "Miami Dolphins",
  Eagles: "Philadelphia Eagles",
  Falcons: "Atlanta Falcons",
  Giants: "New York Giants",
  Jaguars: "Jacksonville Jaguars",
  Jets: "New York Jets",
  Lions: "Detroit Lions",
  Packers: "Green Bay Packers",
  Panthers: "Carolina Panthers",
  Patriots: "New England Patriots",
  Raiders: "Las Vegas Raiders",
  Rams: "Los Angeles Rams",
  Ravens: "Baltimore Ravens",
  Saints: "New Orleans Saints",
  Seahawks: "Seattle Seahawks",
  Steelers: "Pittsburgh Steelers",
  Texans: "Houston Texans",
  Titans: "Tennessee Titans",
  Vikings: "Minnesota Vikings",
  Commanders: "Washington Commanders",
  Redskins: "Washington Redskins",
};
const nbaFullNames = {
  "76ers": "Philadelphia 76ers",
  Bucks: "Milwaukee Bucks",
  Bulls: "Chicago Bulls",
  Cavaliers: "Cleveland Cavaliers",
  Celtics: "Boston Celtics",
  Clippers: "Los Angeles Clippers",
  Grizzlies: "Memphis Grizzlies",
  Hawks: "Atlanta Hawks",
  Heat: "Miami Heat",
  Hornets: "Charlotte Hornets",
  Jazz: "Utah Jazz",
  Kings: "Sacramento Kings",
  Knicks: "New York Knicks",
  Lakers: "Los Angeles Lakers",
  Magic: "Orlando Magic",
  Mavericks: "Dallas Mavericks",
  Nets: "Brooklyn Nets",
  Nuggets: "Denver Nuggets",
  Pacers: "Indiana Pacers",
  Pelicans: "New Orleans Pelicans",
  Pistons: "Detroit Pistons",
  Raptors: "Toronto Raptors",
  Rockets: "Houston Rockets",
  Spurs: "San Antonio Spurs",
  Suns: "Phoenix Suns",
  Thunder: "Oklahoma City Thunder",
  Timberwolves: "Minnesota Timberwolves",
  "Trail Blazers": "Portland Trail Blazers",
  Warriors: "Golden State Warriors",
  Wizards: "Washington Wizards",
};
const mlbFullNames = {
  Angels: "Los Angeles Angels",
  Astros: "Houston Astros",
  Athletics: "Oakland Athletics",
  "Blue Jays": "Toronto Blue Jays",
  Braves: "Atlanta Braves",
  Brewers: "Milwaukee Brewers",
  Cardinals: "St. Louis Cardinals",
  Cubs: "Chicago Cubs",
  Diamondbacks: "Arizona Diamondbacks",
  Dodgers: "Los Angeles Dodgers",
  Giants: "San Francisco Giants",
  Guardians: "Cleveland Guardians",
  Mariners: "Seattle Mariners",
  Marlins: "Miami Marlins",
  Mets: "New York Mets",
  Nationals: "Washington Nationals",
  Orioles: "Baltimore Orioles",
  Padres: "San Diego Padres",
  Phillies: "Philadelphia Phillies",
  Pirates: "Pittsburgh Pirates",
  Rangers: "Texas Rangers",
  Rays: "Tampa Bay Rays",
  "Red Sox": "Boston Red Sox",
  Reds: "Cincinnati Reds",
  Rockies: "Colorado Rockies",
  Royals: "Kansas City Royals",
  Tigers: "Detroit Tigers",
  Twins: "Minnesota Twins",
  "White Sox": "Chicago White Sox",
  Yankees: "New York Yankees",
};

const getFullTeamName = (league, team) => {
  if (league === "NFL") return nflFullNames[team] || team;
  if (league === "NBA") return nbaFullNames[team] || team;
  if (league === "MLB") return mlbFullNames[team] || team;
  return team;
};

const getPlayerNames = () =>
  Object.keys(playerTeamMap)
    .map((k) => (playerTeamMap[k] ? k : null))
    .filter(Boolean);

const teamsByLeague = {
  NBA: Object.keys(nbaLogoMap).filter((t) => t !== "NBA"),
  NFL: Object.keys(nflLogoMap).filter((t) => t !== "NFL"),
  MLB: Object.keys(mlbLogoMap).filter((t) => t !== "MLB"),
  PGA: [],
  CFL: [],
};

const TAB_LABELS = {
  Prop: "Props",
  "Player Award": "Awards",
  "Team Bet": "Team Futures",
  "Stat Leader": "Stat Leaders",
};

const TYPE_OPTIONS = Object.keys(TAB_LABELS);

const TEAM_BET_SUBTYPES = [
  { value: "Win Total", label: "Win Total" },
  { value: "Super Bowl", label: "Super Bowl Winner" },
  { value: "Division Winner", label: "Division Winner" },
  { value: "Conference Winner", label: "Conference Winner" },
  { value: "Playoffs", label: "Make Playoffs" },
];

const initialForm = {
  site: "FD",
  league: "NFL",
  type: "Prop",
  player: "",
  team: "",
  odds: "",
  award: "",
  bet: "Win Total",
  betSubtype: "Win Total",
  value: "",
  stat: "",
  ou: "Over",
  line: "",
};

const getTeamOptions = (league) => {
  if (league === "NFL")
    return Object.keys(nflFullNames).sort((a, b) =>
      nflFullNames[a].localeCompare(nflFullNames[b])
    );
  if (league === "NBA")
    return Object.keys(nbaFullNames).sort((a, b) =>
      nbaFullNames[a].localeCompare(nbaFullNames[b])
    );
  if (league === "MLB")
    return Object.keys(mlbFullNames).sort((a, b) =>
      mlbFullNames[a].localeCompare(mlbFullNames[b])
    );
  return [];
};

const NFL_STATS = [
  "Pass Yds",
  "Pass TD",
  "Rush Yds",
  "Rec Yds",
  "Rec",
  "Sk",
  "ATTD",
];

const AddBetModal = ({ onClose }) => {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [_showTeamSuggestions, _setShowTeamSuggestions] = useState(false);
  const [filteredTeams, setFilteredTeams] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Odds input: default to + if not starting with -
    if (name === "odds") {
      let oddsValue = value;
      if (oddsValue && oddsValue[0] !== "-" && oddsValue[0] !== "+") {
        oddsValue = "+" + oddsValue.replace(/^\+/, "");
      }
      setForm({ ...form, odds: oddsValue });
      return;
    }

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
      // Autocomplete logic
      const allPlayers = getPlayerNames();
      setFilteredPlayers(
        value.length > 0
          ? allPlayers.filter((p) =>
              p.toLowerCase().includes(value.toLowerCase())
            )
          : []
      );
      setShowSuggestions(value.length > 0 && filteredPlayers.length > 0);
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

    if (name === "team") {
      const options = getTeamOptions(form.league);
      setFilteredTeams(
        value.length > 0
          ? options.filter((t) => t.toLowerCase().includes(value.toLowerCase()))
          : options
      );
      _setShowTeamSuggestions(value.length > 0 && filteredTeams.length > 0);
    }

    setForm({ ...form, [name]: value });
  };

  const handleSuggestionClick = (name) => {
    setForm({ ...form, player: name });
    setShowSuggestions(false);
  };

  const _handleTeamSuggestionClick = (team) => {
    setForm({ ...form, team });
    _setShowTeamSuggestions(false);
  };

  const fetchHeadshot = async (player, league) => {
    if (!player || league !== "NFL") return;
    try {
      await fetch("/api/bets/headshots/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: player }),
      });
    } catch {
      // Ignore errors for headshot fetch
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setMessage("");
    setIsError(false);
    const playerKey = form.player.trim().toLowerCase();
    const teamName = getFullTeamName(
      form.league,
      form.team || playerTeamMap[playerKey] || ""
    );

    try {
      const bet = {
        sport: form.league,
        category: TAB_LABELS[form.type],
        market: form.betSubtype || form.stat || "",
        selection: form.type === "Team Bet" ? teamName : form.player,
        odds_american: form.odds,
        line: form.type === "Prop" ? form.line || null : null,
        book: form.site,
        notes: "",
      };

      await betService.addBet(bet);

      // Fetch headshot for NFL players
      await fetchHeadshot(form.player, form.league);

      if (playerKey && teamName) {
        playerTeamMap[playerKey] = teamName;
      } else if (form.player) {
        playerTeamMap[form.player.trim().toLowerCase()] = form.team || "";
      }

      setForm(initialForm);
      setMessage("Bet saved!");
      window.dispatchEvent(new Event("betsUpdated"));
      setIsSubmitting(false);
      if (typeof onClose === "function") onClose();
    } catch {
      setIsError(true);
      setMessage("Error saving bet.");
      setIsSubmitting(false);
    }
  };

  // Render the form fields based on the bet type
  const renderDynamicFields = () => {
    switch (form.type) {
      case "Player Award":
        return (
          <div className="space-y-4">
            {/* Player/Team group */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Player
                </label>
                <input
                  type="text"
                  name="player"
                  placeholder="Enter player name"
                  value={form.player}
                  onChange={handleChange}
                  onFocus={() => setShowSuggestions(filteredPlayers.length > 0)}
                  onBlur={() =>
                    setTimeout(() => setShowSuggestions(false), 100)
                  }
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                  required
                />
                {showSuggestions && filteredPlayers.length > 0 && (
                  <ul className="absolute z-10 left-0 right-0 bg-neutral-900 border border-neutral-700 rounded-lg mt-1 max-h-32 overflow-y-auto">
                    {filteredPlayers.map((name) => (
                      <li
                        key={name}
                        className="px-3 py-1 text-sm text-white cursor-pointer hover:bg-neutral-700"
                        onMouseDown={() => handleSuggestionClick(name)}
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex-1 relative">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Team
                </label>
                <select
                  name="team"
                  value={form.team}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                  required
                >
                  <option value="">Select team</option>
                  {getTeamOptions(form.league).map((team) => (
                    <option key={team} value={team}>
                      {getFullTeamName(form.league, team)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Award and Odds */}
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Award
                </label>
                <input
                  type="text"
                  name="award"
                  value={form.award}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                  required
                />
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Odds
                </label>
                <input
                  type="text"
                  name="odds"
                  value={form.odds}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-right"
                  required
                />
              </div>
            </div>
          </div>
        );

      case "Team Bet":
        return (
          <div className="space-y-4">
            {/* Team */}
            <div className="relative">
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Team
              </label>
              <select
                name="team"
                value={form.team}
                onChange={handleChange}
                className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                required
              >
                <option value="">Select team</option>
                {getTeamOptions(form.league).map((team) => (
                  <option key={team} value={team}>
                    {getFullTeamName(form.league, team)}
                  </option>
                ))}
              </select>
            </div>

            {/* Bet Type */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Bet Type
              </label>
              <select
                name="betSubtype"
                value={form.betSubtype}
                onChange={handleChange}
                className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                required
              >
                {TEAM_BET_SUBTYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Win Total specific fields */}
            {form.betSubtype === "Win Total" && (
              <div className="flex gap-2 items-end">
                <div className="w-20">
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    O/U
                  </label>
                  <select
                    name="ou"
                    value={form.ou}
                    onChange={handleChange}
                    className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                    required
                  >
                    <option value="Over">Over</option>
                    <option value="Under">Under</option>
                  </select>
                </div>
                <div className="w-20">
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Value
                  </label>
                  <input
                    type="text"
                    name="value"
                    value={form.value}
                    onChange={handleChange}
                    className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-right"
                    required
                  />
                </div>
                <div className="w-20">
                  <label className="block text-xs font-medium text-neutral-300 mb-1">
                    Odds
                  </label>
                  <input
                    type="text"
                    name="odds"
                    value={form.odds}
                    onChange={handleChange}
                    className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-right"
                    required
                  />
                </div>
              </div>
            )}

            {/* Non-Win Total odds */}
            {form.betSubtype !== "Win Total" && (
              <div className="w-20">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Odds
                </label>
                <input
                  type="text"
                  name="odds"
                  value={form.odds}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-right"
                  required
                />
              </div>
            )}
          </div>
        );
      case "Stat Leader":
        return (
          <div className="space-y-4">
            {/* Player/Team group */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Player
                </label>
                <input
                  type="text"
                  name="player"
                  placeholder="Enter player name"
                  value={form.player}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                  required
                />
              </div>
              <div className="flex-1 relative">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Team
                </label>
                <select
                  name="team"
                  value={form.team}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                  required
                >
                  <option value="">Select team</option>
                  {getTeamOptions(form.league).map((team) => (
                    <option key={team} value={team}>
                      {getFullTeamName(form.league, team)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stat and Odds */}
            <div className="flex gap-2 items-end">
              <div className="w-32">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Stat
                </label>
                {form.league === "NFL" ? (
                  <select
                    name="stat"
                    value={form.stat}
                    onChange={handleChange}
                    className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                    required
                  >
                    <option value="">Select stat</option>
                    {NFL_STATS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="stat"
                    value={form.stat}
                    onChange={handleChange}
                    className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                    required
                  />
                )}
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Odds
                </label>
                <input
                  type="text"
                  name="odds"
                  value={form.odds}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-right"
                  required
                />
              </div>
            </div>
          </div>
        );
      case "Prop":
        return (
          <div className="space-y-4">
            {/* Player/Team group */}
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Player
                </label>
                <input
                  type="text"
                  name="player"
                  placeholder="Enter player name"
                  value={form.player}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                  required
                />
              </div>
              <div className="flex-1 relative">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Team
                </label>
                <select
                  name="team"
                  value={form.team}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                  required
                >
                  <option value="">Select team</option>
                  {getTeamOptions(form.league).map((team) => (
                    <option key={team} value={team}>
                      {getFullTeamName(form.league, team)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Bet details group */}
            <div className="flex gap-2 items-end">
              <div className="w-32">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Stat
                </label>
                <input
                  type="text"
                  name="stat"
                  value={form.stat}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                  required
                />
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  O/U
                </label>
                <select
                  name="ou"
                  value={form.ou}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm"
                  required
                >
                  <option value="Over">Over</option>
                  <option value="Under">Under</option>
                </select>
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Line
                </label>
                <input
                  type="text"
                  name="line"
                  value={form.line}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-right"
                  required
                />
              </div>
              <div className="w-20">
                <label className="block text-xs font-medium text-neutral-300 mb-1">
                  Odds
                </label>
                <input
                  type="text"
                  name="odds"
                  value={form.odds}
                  onChange={handleChange}
                  className="w-full p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-right"
                  required
                />
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-neutral-900 w-full max-w-md rounded-xl text-white">
        <div className="flex flex-col">
          {/* Header with League Selection */}
          <div className="px-4 py-3 border-b border-neutral-800">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-semibold">Add Bet</h2>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-white text-xl leading-none transition-colors"
              >
                ✕
              </button>
            </div>

            {/* League Toggle Buttons */}
            <div className="flex gap-1.5">
              {["NFL", "NBA", "MLB"].map((lg) => (
                <button
                  key={lg}
                  onClick={() =>
                    handleChange({ target: { name: "league", value: lg } })
                  }
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    form.league === lg
                      ? "bg-neutral-200 text-neutral-900"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
                  }`}
                >
                  {lg}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <form className="space-y-4">
              {/* Bet Type Selection as tabs */}
              <div className="mb-4">
                <div className="flex gap-2">
                  {TYPE_OPTIONS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() =>
                        handleChange({ target: { name: "type", value: t } })
                      }
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        form.type === t
                          ? "bg-neutral-500 text-neutral-900 shadow-lg text-white border-neutral-300"
                          : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white"
                      }`}
                    >
                      {TAB_LABELS[t]}
                    </button>
                  ))}
                </div>
                {/* Subtle divider below type tabs */}
                <div className="flex justify-center mt-2 mb-1">
                  <div className="h-1 w-16 bg-neutral-700 rounded-full opacity-60" />
                </div>
              </div>
              {/* Dynamic fields based on bet type */}
              {renderDynamicFields()}
            </form>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-neutral-800">
            {message && (
              <p
                className={`text-center text-xs mb-2 ${
                  isError ? "text-red-400" : "text-green-400"
                }`}
              >
                {message}
              </p>
            )}
            <div className="flex gap-2 items-center">
              <select
                name="site"
                value={form.site}
                onChange={handleChange}
                className="w-24 p-2 bg-neutral-800 border border-neutral-700 rounded-lg text-xs"
              >
                {["FD", "DK", "MG", "CAESARS"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`flex-1 bg-neutral-700 hover:bg-neutral-600 text-white py-2 rounded-lg font-semibold transition-colors text-sm ${
                  isSubmitting ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                Add Bet
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBetModal;
