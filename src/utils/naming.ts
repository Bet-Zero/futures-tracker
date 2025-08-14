export type Category =
  | "All"
  | "Awards"
  | "Team Futures"
  | "Stat Leaders"
  | "Props";

export const USE_SHORT_CATEGORY_LABELS = true;

export const CATEGORY_DISPLAY: Record<Category, { short: string; long: string }> = {
  "All": { short: "All", long: "All" },
  "Awards": { short: "Awards", long: "Player Awards" },
  "Team Futures": { short: "Futures", long: "Team Futures" },
  "Stat Leaders": { short: "Leaders", long: "Stat Leaders" },
  "Props": { short: "Props", long: "Props" },
};

export function displayCategoryLabel(cat: Category): string {
  const d = CATEGORY_DISPLAY[cat];
  return USE_SHORT_CATEGORY_LABELS ? d.short : d.long;
}

// Back-compat param mappers
export function coerceSport(v?: string | null) {
  return (v || "").toUpperCase() || "NFL";
}
export function coerceCategory(params: URLSearchParams): Category {
  const raw =
    params.get("category") ||
    params.get("group") ||
    params.get("type") ||
    params.get("tabLabel") ||
    "All";
  const k = String(raw).toLowerCase();
  const map: Record<string, Category> = {
    "all": "All",
    "awards": "Awards",
    "team futures": "Team Futures",
    "stat leaders": "Stat Leaders",
    "props": "Props",
  };
  return map[k] ?? "All";
}
export function coerceMarket(params: URLSearchParams) {
  return params.get("market") || params.get("subtype") || "";
}
