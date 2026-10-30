// Swap BASE for your self-hosted URL later, if you go that route
/*const BASE = process.env.BIBLE_API_URL || "https://bible-api.com";

// Scripture never changes, so cache aggressively (capped to avoid unbounded growth)
const cache = new Map();
const MAX_ENTRIES = 5000;

export async function getPassage(ref, translation = "web") {
  const key = `${translation}:${ref.toLowerCase().trim()}`;
  if (cache.has(key)) return cache.get(key);

  const url = `${BASE}/${encodeURIComponent(ref)}?translation=${encodeURIComponent(translation)}`;
  const res = await fetch(url);

  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Bible API responded ${res.status}`);

  const data = await res.json();
  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value);
  cache.set(key, data);
  return data;
}*/