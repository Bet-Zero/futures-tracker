import playerHeadshots from "../data/playerHeadshots.json";

export function getHeadshotUrl(player, league, providedImage) {
  if (providedImage) return providedImage;
  if (league !== "NFL") return null;
  return playerHeadshots[player] || null;
}

export default getHeadshotUrl;
