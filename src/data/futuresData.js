// src/data/futuresData.js

// Base NFL data used for demonstration
const nflData = [
  // FUTURES
  {
    type: "Futures",
    category: "Super Bowl",
    label: "Chiefs",
    rightText: "+550",
    group: "To Win",
  },
  {
    type: "Futures",
    category: "Super Bowl",
    label: "Lions",
    rightText: "+1200",
    group: "To Win",
  },

  {
    type: "Futures",
    category: "NFC",
    label: "49ers",
    rightText: "+350",
    group: "To Win",
  },
  {
    type: "Futures",
    category: "AFC East",
    label: "Bills",
    rightText: "+120",
    group: "To Win",
  },

  {
    type: "Futures",
    category: "Win Total",
    label: "Chiefs",
    line: 11.5,
    odds: "-110",
    ou: "o",
    group: "Win Totals",
  },
  {
    type: "Futures",
    category: "Make Playoffs",
    label: "Lions",
    rightText: "-180",
    group: "Playoffs",
  },

  // AWARDS
  {
    type: "Awards",
    category: "MVP",
    label: "Patrick Mahomes",
    rightText: "+450",
  },
  {
    type: "Awards",
    category: "MVP",
    label: "Matthew Stafford",
    rightText: "+3000",
  },
  {
    type: "Awards",
    category: "DPOY",
    label: "Micah Parsons",
    rightText: "+550",
  },
  {
    type: "Awards",
    category: "DPOY",
    label: "Aidan Hutchinson",
    rightText: "+1100",
  },

  // PLAYER PROPS
  {
    type: "Props",
    category: "Pass Yds",
    label: "Matthew Stafford",
    rightText: "o3825.5",
    line: 3825.5,
    odds: "-110",
    ou: "o",
    starred: true,
  },
  {
    type: "Props",
    category: "Pass Yds",
    label: "Bryce Young",
    rightText: "o3200.5",
    line: 3200.5,
    odds: "-110",
    ou: "o",
  },
  {
    type: "Props",
    category: "Rush Yds",
    label: "Aaron Jones",
    rightText: "o725.5",
    line: 725.5,
    odds: "-110",
    ou: "o",
  },
  {
    type: "Props",
    category: "Rush Yds",
    label: "Jonathan Taylor",
    rightText: "o1050.5",
    line: 1050.5,
    odds: "-110",
    ou: "o",
    starred: true,
  },

  // YARDAGE CLUBS
  {
    type: "Props",
    category: "4000+ Pass Yds",
    label: "Jared Goff",
    rightText: "-130",
  },
  {
    type: "Props",
    category: "4000+ Pass Yds",
    label: "Will Levis",
    rightText: "+290",
    starred: true,
  },
  {
    type: "Props",
    category: "1000+ Rush Yds",
    label: "Saquon Barkley",
    rightText: "-110",
  },
  {
    type: "Props",
    category: "1000+ Rush Yds",
    label: "Josh Jacobs",
    rightText: "+110",
  },

  // LEADERS
  {
    type: "Leaders",
    category: "Pass Yds",
    label: "Matthew Stafford",
    rightText: "+2100",
    starred: true,
  },
  {
    type: "Leaders",
    category: "Pass Yds",
    label: "Sam Darnold",
    rightText: "+3500",
    starred: true,
  },
  {
    type: "Leaders",
    category: "Rush TD",
    label: "David Montgomery",
    rightText: "+1300",
  },
  {
    type: "Leaders",
    category: "Rush TD",
    label: "Saquon Barkley",
    rightText: "+2200",
  },
  {
    type: "Leaders",
    category: "Rec Yds",
    label: "Garrett Wilson",
    rightText: "+1600",
  },
  {
    type: "Leaders",
    category: "Rec Yds",
    label: "Cooper Kupp",
    rightText: "+3900",
    starred: true,
  },
];

// Minimal sample data for other leagues
const nbaData = [
  {
    type: "Futures",
    category: "Championship",
    label: "Lakers",
    rightText: "+850",
    group: "To Win",
  },
  { type: "Awards", category: "MVP", label: "Luka Doncic", rightText: "+450" },
  {
    type: "Props",
    category: "Points",
    label: "Shai Gilgeous-Alexander",
    rightText: "o30.5",
    line: 30.5,
    odds: "-110",
    ou: "o",
  },
];

const mlbData = [
  {
    type: "Futures",
    category: "World Series",
    label: "Braves",
    rightText: "+350",
    group: "To Win",
  },
  { type: "Awards", category: "MVP", label: "Shohei Ohtani", rightText: "+150" },
  {
    type: "Props",
    category: "Home Runs",
    label: "Aaron Judge",
    rightText: "o45.5",
    line: 45.5,
    odds: "-110",
    ou: "o",
  },
];

export const futuresByLeague = {
  NFL: nflData,
  NBA: nbaData,
  MLB: mlbData,
};
