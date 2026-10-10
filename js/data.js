// ==========================================================
// STRAIN DATA
// Loads the strains, trims them to the fields we need, and keeps
// a copy in the browser for 24 hours.
// Order we try:
//   1. a copy saved in this browser less than 24 hours ago
//   2. the Cannlytics API
//   3. an older saved copy (if the API is down)
//   4. the backup file that ships with the project (data/strains-backup.json)
// ==========================================================

// Cannlytics strain data: free, no API key needed
const STRAINS_URL = `https://cannlytics.com/api/data/strains`;
const BACKUP_URL = `data/strains-backup.json`;

const CACHE_KEY = `strain-finder:strains`;
const CACHE_HOURS = 24;

// The main terpenes we show on each strain (API field name -> label)
const MAIN_TERPENES = {
  beta_myrcene: `Myrcene`,
  d_limonene: `Limonene`,
  beta_caryophyllene: `Caryophyllene`,
  linalool: `Linalool`,
  alpha_pinene: `Pinene`,
  humulene: `Humulene`,
  terpinolene: `Terpinolene`,
};

// ----------------------------------------------------------
// SHAPING THE DATA
// ----------------------------------------------------------

// THCA and CBDA turn into THC and CBD when heated. Labs count them as
// 87.7% of their weight (the rest is lost as CO2).
const ACID_TO_ACTIVE = 0.877;

// Uses the API's total when it has one. About half the strains have a
// total of 0, so for those we add it up from the parts with the lab formula.
const totalOrCalculated = (total, active, acid) =>
  total > 0 ? total : (active || 0) + (acid || 0) * ACID_TO_ACTIVE;

// Rounds to 1 decimal place: 21.5428 becomes 21.5
const roundToTenth = (value) => Math.round(value * 10) / 10;

// Keeps only the fields the app needs from one API strain.
// Each strain from the API has 50+ fields; we keep 8.
const simplifyStrain = (strain) => ({
  // Name: strain_name is sometimes missing, so fall back to the id
  name: strain.strain_name || strain.id,
  description: strain.description || ``,
  imageUrl: strain.image_url || ``,

  // Cannabinoids, as percentages (e.g. 21.5)
  totalThc: roundToTenth(totalOrCalculated(strain.total_thc, strain.delta_9_thc, strain.thca)),
  totalCbd: roundToTenth(totalOrCalculated(strain.total_cbd, strain.cbd, strain.cbda)),

  // Main terpenes, e.g. { Myrcene: 0.55, Limonene: 0.12, ... }
  terpenes: Object.fromEntries(
    Object.entries(MAIN_TERPENES).map(([field, label]) => [label, strain[field] || 0]),
  ),

  // Lists like ["aroma_earthy"] and ["effect_relaxed", "effect_migraines"]
  aromas: strain.potential_aromas || [],
  effects: strain.potential_effects || [],
});

// ----------------------------------------------------------
// BROWSER COPY (localStorage can be blocked, so every call is in try/catch)
// ----------------------------------------------------------

const readSavedCopy = () => {
  try {
    const text = localStorage.getItem(CACHE_KEY);
    return text ? JSON.parse(text) : false;
  } catch (error) {
    return false;
  }
};

const writeSavedCopy = (strains) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), strains }));
  } catch (error) {
    // Storage is full or blocked: the app still works, it just won't remember
  }
};

const isFresh = (copy) => Date.now() - copy.savedAt < CACHE_HOURS * 60 * 60 * 1000;

// ----------------------------------------------------------
// LOADING
// ----------------------------------------------------------

// Fetches a strains file (the API or the backup) and trims it
const fetchStrains = async (url) => {
  let response;
  try {
    response = await fetch(url);
  } catch (error) {
    // The browser's own message ("Failed to fetch") isn't helpful, so use a clearer one
    throw new Error(`Could not reach the server.`);
  }

  // fetch only throws on network errors, so check the HTTP status too
  if (!response.ok) {
    throw new Error(`The server answered ${response.status} ${response.statusText}.`);
  }

  const data = await response.json();

  // Steps 1 and 2 from class: log the raw response and the trimmed list
  console.log(`Cannlytics response:`, data);
  const strainSummaries = data.data.map(simplifyStrain);
  console.log(`strainSummaries (trimmed):`, strainSummaries);
  console.log(`Fields kept: ${Object.keys(strainSummaries[0]).join(`, `)}`);

  return strainSummaries;
};

// Returns { strains, source, savedAt } where source is `saved`, `live`, `stale` or `backup`
export const loadStrainData = async () => {
  const savedCopy = readSavedCopy();

  // 1. A recent copy in this browser: no network needed
  if (savedCopy && isFresh(savedCopy)) {
    console.log(`Using the copy saved in this browser.`);
    return { strains: savedCopy.strains, source: `saved`, savedAt: savedCopy.savedAt };
  }

  // 2. The live API
  try {
    const strains = await fetchStrains(STRAINS_URL);
    writeSavedCopy(strains);
    return { strains, source: `live`, savedAt: Date.now() };
  } catch (error) {
    console.warn(`Cannlytics API failed, trying a saved copy:`, error);
  }

  // 3. An older copy is better than nothing
  if (savedCopy) {
    return { strains: savedCopy.strains, source: `stale`, savedAt: savedCopy.savedAt };
  }

  // 4. The backup file in the project (throws if this fails too)
  const strains = await fetchStrains(BACKUP_URL);
  return { strains, source: `backup`, savedAt: 0 };
};

// Forgets the saved copy so the next load asks the API again
export const clearSavedCopy = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    // Storage is blocked; nothing to clear
  }
};
