// ==========================================================
// FAVORITES
// Strain names saved in this browser.
// ==========================================================

const FAVORITES_KEY = `strain-finder:favorites`;

// The saved names (an empty list if none, or if storage is blocked)
export const getFavorites = () => {
  try {
    const text = localStorage.getItem(FAVORITES_KEY);
    return text ? JSON.parse(text) : [];
  } catch (error) {
    return [];
  }
};

export const isFavorite = (name) => getFavorites().includes(name);

// Adds or removes a strain. Returns true if it is now a favorite.
export const toggleFavorite = (name) => {
  const favorites = getFavorites();
  const nowFavorite = !favorites.includes(name);
  const updated = nowFavorite ? [...favorites, name] : favorites.filter((entry) => entry !== name);
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  } catch (error) {
    // Storage is blocked: the heart still changes for this visit
  }
  return nowFavorite;
};
