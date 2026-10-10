// ==========================================================
// FILE: js/main.js
// WHAT IT DOES: Runs the page. When someone searches, it checks
// what they typed, finds the matching symptom, applies the THC/CBD
// and favorites filters, sorts the list, and shows the cards. It also
// shows the loading box, the "nothing found" help, and error messages.
// WHY IT'S BUILT THIS WAY: This is the only file that touches the
// search form. The other files each do one job and are imported here:
//   data.js       loading + trimming the strains (class steps 1 and 2)
//   symptoms.js   everyday words -> effect labels, matching
//   cards.js      strain cards + detail view (class step 3)
//   favorites.js  saved strains
//   dom.js        small helpers
// ==========================================================

import { loadStrainData, clearSavedCopy } from './data.js';
import { SYMPTOMS, findSymptom, strainsForSymptom, symptomCounts } from './symptoms.js';
import { renderStrains, onFavoriteChange, lastDetailOpener } from './cards.js';
import { getFavorites } from './favorites.js';
import { el, labelFor } from './dom.js';

// ----------------------------------------------------------
// ELEMENTS
// ----------------------------------------------------------

const searchForm = document.querySelector(`#search-form`);
const symptomInput = document.querySelector(`#symptom`);
const symptomError = document.querySelector(`#symptom-error`);
const symptomOptions = document.querySelector(`#symptom-options`);
const thcFilter = document.querySelector(`#thc-filter`);
const cbdFilter = document.querySelector(`#cbd-filter`);
const sortSelect = document.querySelector(`#sort`);
const favoritesOnly = document.querySelector(`#favorites-only`);
const favoritesError = document.querySelector(`#favorites-only-error`);
const clearButton = document.querySelector(`#clear-button`);
const quickSymptoms = document.querySelector(`#quick-symptoms`);
const statusMessage = document.querySelector(`#status`);
const resultsSection = document.querySelector(`#results`);
const resultsHeading = document.querySelector(`#results-heading`);
const resultsNote = document.querySelector(`#results-note`);
const loadingMessage = document.querySelector(`#loading`);
const emptyState = document.querySelector(`#empty-state`);
const emptyMessage = document.querySelector(`#empty-message`);
const emptySuggestions = document.querySelector(`#empty-suggestions`);
const strainList = document.querySelector(`#strain-list`);
const strainDialog = document.querySelector(`#strain-dialog`);
const dataNote = document.querySelector(`#data-note`);
const refreshButton = document.querySelector(`#refresh-data`);

// ----------------------------------------------------------
// APP STATE
// ----------------------------------------------------------

const state = {
  strains: [],        // every strain (trimmed)
  symptom: false,     // the symptom being searched, or false for "all strains"
  searchedText: ``,   // exactly what was typed, e.g. "brain fog"
};

// ----------------------------------------------------------
// STATUS MESSAGES
// The status box is always read by screen readers. It is only shown
// on screen for loading and problems; for results, the heading says it.
// ----------------------------------------------------------

const announce = (message, showOnScreen) => {
  statusMessage.textContent = message;
  statusMessage.classList.toggle(`visually-hidden`, !showOnScreen);
};

// ----------------------------------------------------------
// LOADING STATE (step 4)
// ----------------------------------------------------------

const showLoading = () => {
  loadingMessage.hidden = false;
  emptyState.hidden = true;
  resultsSection.setAttribute(`aria-busy`, `true`);
  strainList.replaceChildren();
  announce(`Loading strain data…`, true);
};

const hideLoading = () => {
  loadingMessage.hidden = true;
  resultsSection.setAttribute(`aria-busy`, `false`);
};

// ----------------------------------------------------------
// FILTERS AND SORTING
// ----------------------------------------------------------

// THC and CBD filter rules (the select's value -> a test)
const THC_RULES = {
  any: () => true,
  low: (strain) => strain.totalThc < 10,
  medium: (strain) => strain.totalThc >= 10 && strain.totalThc <= 20,
  high: (strain) => strain.totalThc > 20,
};

const CBD_RULES = {
  any: () => true,
  some: (strain) => strain.totalCbd >= 1,
  high: (strain) => strain.totalCbd >= 5,
};

// How many of a strain's effects match the symptom (more = better match)
const matchScore = (strain, symptom) =>
  strain.effects.filter((effect) => symptom.effects.includes(effect)).length;

const byName = (first, second) => first.name.localeCompare(second.name);

const SORTS = {
  best: (first, second) => (state.symptom
    ? matchScore(second, state.symptom) - matchScore(first, state.symptom) || byName(first, second)
    : byName(first, second)),
  name: byName,
  [`thc-desc`]: (first, second) => second.totalThc - first.totalThc,
  [`thc-asc`]: (first, second) => first.totalThc - second.totalThc,
  [`cbd-desc`]: (first, second) => second.totalCbd - first.totalCbd,
};

// Runs every filter, then sorts
const filteredStrains = () => {
  const favorites = getFavorites();
  const base = state.symptom ? strainsForSymptom(state.strains, state.symptom) : state.strains;
  return base
    .filter(THC_RULES[thcFilter.value])
    .filter(CBD_RULES[cbdFilter.value])
    .filter((strain) => !favoritesOnly.checked || favorites.includes(strain.name))
    .sort(SORTS[sortSelect.value]);
};

// True when a THC, CBD or favorites filter is switched on
const filtersActive = () => thcFilter.value !== `any` || cbdFilter.value !== `any` || favoritesOnly.checked;

// ----------------------------------------------------------
// WORDS ABOVE THE RESULTS
// ----------------------------------------------------------

const plural = (count, word) => `${count} ${word}${count === 1 ? `` : `s`}`;

// "3 strains predicted to help with migraines"
// The count only appears once something narrows the list (a symptom or a filter)
const resultsTitle = (count) => {
  const symptom = state.symptom;
  if (!symptom) {
    if (favoritesOnly.checked) {
      return plural(count, `favorite strain`);
    }
    return filtersActive() ? `${plural(count, `strain`)} match your filters` : `All strains`;
  }
  return symptom.via
    ? `${plural(count, `strain`)} predicted to make you feel ${symptom.via}, which may help with ${symptom.name.toLowerCase()}`
    : `${plural(count, `strain`)} predicted to help with ${symptom.name.toLowerCase()}`;
};

// Extra explanation under the title
const resultsExplanation = () => {
  const symptom = state.symptom;
  if (!symptom) {
    return ``;
  }
  const parts = [];

  // Say what their words were matched to, unless they typed the symptom's own name
  if (state.searchedText !== `` && state.searchedText.toLowerCase() !== symptom.name.toLowerCase()) {
    parts.push(`You searched "${state.searchedText}". Showing ${symptom.name.toLowerCase()}.`);
  }
  if (symptom.via) {
    parts.push(`The data has no "${symptom.name.toLowerCase()}" label, so we show strains predicted to make people feel ${symptom.via}.`);
  }
  if (symptom.avoid) {
    parts.push(`Strains that list ${symptom.avoid.map((effect) => labelFor(effect).toLowerCase()).join(` or `)} as a possible side effect are left out.`);
  }
  return parts.join(` `);
};

// ----------------------------------------------------------
// QUICK PICKS AND EMPTY STATE
// ----------------------------------------------------------

// A button that searches for a symptom
const createSymptomButton = (symptom, count) => el(`li`, {},
  el(`button`, {
    type: `button`,
    class: `chip`,
    onclick: () => searchFor(symptom.name),
  }, symptom.name, el(`small`, {}, ` ${count}`)),
);

// Symptoms that have at least one strain, biggest first
const symptomsWithResults = () => symptomCounts(state.strains).filter(({ count }) => count > 0);

const renderQuickPicks = () => {
  quickSymptoms.replaceChildren(...symptomsWithResults().map(({ symptom, count }) => createSymptomButton(symptom, count)));
};

// Explains why nothing matched and offers a way forward
const renderEmptyState = () => {
  const symptom = state.symptom;
  const reasons = [];

  if (symptom && strainsForSymptom(state.strains, symptom).length === 0) {
    reasons.push(`No strains in this data are predicted to help with ${symptom.name.toLowerCase()} yet. The data covers ${state.strains.length} strains and only a few medical labels.`);
  } else if (filtersActive()) {
    reasons.push(`Your filters are hiding every match. Try a different THC or CBD level, or turn off "Favorites only".`);
  }

  emptyMessage.textContent = reasons.join(` `) || `Nothing matches.`;

  // Suggest other symptoms that do have results, plus a reset button
  const suggestions = symptomsWithResults()
    .filter(({ symptom: other }) => other !== symptom)
    .slice(0, 5)
    .map(({ symptom: other, count }) => createSymptomButton(other, count));
  const resetButton = filtersActive()
    ? el(`li`, {}, el(`button`, { type: `button`, class: `chip chip-reset`, onclick: resetFilters }, `Reset filters`))
    : false;

  emptySuggestions.replaceChildren(...suggestions, ...[resetButton].filter((item) => item !== false));
  emptyState.hidden = false;
};

// ----------------------------------------------------------
// DRAWING THE RESULTS
// ----------------------------------------------------------

const showResults = () => {
  const strains = filteredStrains();
  const matched = state.symptom ? state.symptom.effects : [];

  resultsHeading.textContent = resultsTitle(strains.length);
  resultsNote.textContent = resultsExplanation();
  renderStrains(strains, strainList, matched);

  if (strains.length === 0) {
    renderEmptyState();
  } else {
    emptyState.hidden = true;
  }

  announce(`${resultsTitle(strains.length)}.`, false);
};

// ----------------------------------------------------------
// VALIDATION
// HTML attributes (minlength, maxlength, pattern) do the basic checks;
// JavaScript writes the messages and checks the symptom is one we know.
// ----------------------------------------------------------

const setError = (input, errorElement, message) => {
  errorElement.textContent = message;
  input.setCustomValidity(message);
  if (message === ``) {
    input.removeAttribute(`aria-invalid`);
  } else {
    input.setAttribute(`aria-invalid`, `true`);
  }
};

// Returns an error message for the symptom box, or `` if it is fine
const symptomMessage = () => {
  symptomInput.setCustomValidity(``);
  const { validity } = symptomInput;
  const text = symptomInput.value.trim();

  if (text === ``) {
    return ``; // empty is allowed: it shows every strain
  }
  // Length is also checked by hand: browsers only flag tooShort after typing, not after a quick-pick fills the box
  if (validity.tooShort || text.length < symptomInput.minLength) {
    return `Type at least ${symptomInput.minLength} letters.`;
  }
  if (validity.tooLong) {
    return `Keep it under ${symptomInput.maxLength} letters.`;
  }
  if (validity.patternMismatch) {
    return `Use letters only, like "migraine" or "can't sleep".`;
  }
  if (!findSymptom(text)) {
    const examples = symptomsWithResults().slice(0, 4).map(({ symptom }) => symptom.name.toLowerCase()).join(`, `);
    return `We don't have data for "${text}" yet. Try ${examples}.`;
  }
  return ``;
};

// CROSS-FIELD CHECK: "Favorites only" needs at least one saved favorite
const favoritesMessage = () => (favoritesOnly.checked && getFavorites().length === 0
  ? `You haven't saved any favorites yet. Tap ♡ Save on a strain first.`
  : ``);

// ----------------------------------------------------------
// HANDLERS
// ----------------------------------------------------------

// HANDLER FLOW for the search form
const handleSearch = (event) => {
  // Step 1: stop the page from reloading
  event.preventDefault();

  // Step 2: check the symptom box and the favorites filter
  const message = symptomMessage();
  setError(symptomInput, symptomError, message);
  setError(favoritesOnly, favoritesError, favoritesMessage());

  // Step 3: stop and explain if the symptom is not usable
  if (message !== ``) {
    announce(message, false); // the message is already shown under the box
    symptomInput.focus();
    return;
  }

  // Step 4: remember the symptom and show the matching strains
  const text = symptomInput.value.trim();
  state.symptom = text === `` ? false : findSymptom(text);
  state.searchedText = text; // their words stay in the box; the results say what they matched
  showResults();

  // Step 5: move focus to the results so keyboard users land on them
  resultsHeading.focus();
};

// Fills the box with a symptom and searches (used by the quick-pick buttons)
const searchFor = (name) => {
  symptomInput.value = name;
  searchForm.requestSubmit();
};

// Filters apply right away, without pressing the button
const handleFilterChange = () => {
  setError(favoritesOnly, favoritesError, favoritesMessage());
  showResults();
};

// Puts the THC, CBD and favorites filters back to "any"
const resetFilters = () => {
  thcFilter.value = `any`;
  cbdFilter.value = `any`;
  favoritesOnly.checked = false;
  handleFilterChange();
  resultsHeading.focus();
};

// Clears everything and shows all strains again
const handleClear = () => {
  searchForm.reset();
  state.symptom = false;
  state.searchedText = ``;
  setError(symptomInput, symptomError, ``);
  setError(favoritesOnly, favoritesError, ``);
  showResults();
  symptomInput.focus();
};

// While fixing an error, re-check as they type
const handleSymptomInput = () => {
  if (symptomInput.hasAttribute(`aria-invalid`)) {
    setError(symptomInput, symptomError, symptomMessage());
  }
};

// When a heart is tapped while "Favorites only" is on, the list changes
onFavoriteChange((strain, nowSaved) => {
  announce(nowSaved ? `${strain.name} saved to favorites.` : `${strain.name} removed from favorites.`, false);
  if (favoritesOnly.checked && !strainDialog.open) {
    showResults();
    resultsHeading.focus(); // the card that had focus may be gone
  }
});

// When the detail view closes: refresh the list if favorites changed inside it,
// then put focus back on the Details button that opened it (or the results heading if it's gone)
strainDialog.addEventListener(`close`, () => {
  if (favoritesOnly.checked) {
    showResults();
  }
  const opener = lastDetailOpener();
  if (opener && opener.isConnected) {
    opener.focus();
  } else {
    resultsHeading.focus();
  }
});

// ----------------------------------------------------------
// LOADING THE DATA
// ----------------------------------------------------------

// "Saved in this browser 2 hours ago"
const describeSource = ({ source, savedAt }) => {
  const hours = Math.round((Date.now() - savedAt) / (60 * 60 * 1000));
  const age = hours < 1 ? `less than an hour ago` : `${plural(hours, `hour`)} ago`;
  const messages = {
    live: `Loaded fresh from Cannlytics.`,
    saved: `Using the copy saved in this browser ${age}.`,
    stale: `Cannlytics is not answering, so this is the copy saved ${age}.`,
    backup: `Cannlytics is not answering, so this is the backup copy included with the app.`,
  };
  return messages[source];
};

const loadStrains = async () => {
  showLoading();
  try {
    const result = await loadStrainData();
    state.strains = result.strains;
    dataNote.textContent = describeSource(result);
    renderQuickPicks();
    showResults();
  } catch (error) {
    console.error(`Could not load strains:`, error);
    announce(`Sorry, the strain data could not be loaded. ${error.message} Check your connection and press "Refresh data" below.`, true);
    resultsHeading.textContent = `Strains`;
  } finally {
    hideLoading();
  }
};

// ----------------------------------------------------------
// START UP
// ----------------------------------------------------------

// Suggestion list for the symptom box
symptomOptions.replaceChildren(...SYMPTOMS.map((symptom) => el(`option`, { value: symptom.name })));

searchForm.addEventListener(`submit`, handleSearch);
symptomInput.addEventListener(`input`, handleSymptomInput);
[thcFilter, cbdFilter, sortSelect, favoritesOnly].forEach((control) => control.addEventListener(`change`, handleFilterChange));
clearButton.addEventListener(`click`, handleClear);
refreshButton.addEventListener(`click`, () => {
  clearSavedCopy();
  loadStrains();
});

loadStrains();
