// src/data/logoBgPosition.js

// All teams start at center 50%
import { nflLogoMap, nbaLogoMap, mlbLogoMap } from "../utils/logoMap";

const logoBgPosition = {};

// NFL
Object.keys(nflLogoMap).forEach((team) => {
  logoBgPosition[team] = "center 50%";
});
// NBA
Object.keys(nbaLogoMap).forEach((team) => {
  logoBgPosition[team] = "center 50%";
});
// MLB
Object.keys(mlbLogoMap).forEach((team) => {
  logoBgPosition[team] = "center 50%";
});

export default logoBgPosition;