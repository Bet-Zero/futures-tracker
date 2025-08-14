import playerHeadshots from "../data/playerHeadshots.json";

export function getHeadshotUrl(player, sport, providedImage) {
  if (providedImage) return providedImage;
  if (sport !== "NFL") return null;
  return playerHeadshots[player] || null;
}

export default getHeadshotUrl;
