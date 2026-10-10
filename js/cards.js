// ==========================================================
// FILE: js/cards.js
// WHAT IT DOES: Draws each strain as a card (photo, THC/CBD, what it is
// predicted to help with, side effects) and opens the detail view with
// the full description, terpenes and aromas when "Details" is pressed.
// WHY IT'S BUILT THIS WAY: Everything is built with el() instead of
// innerHTML, so text that comes from the API can never run as code.
// ==========================================================

import { el, labelFor } from './dom.js';
import { groupEffects } from './symptoms.js';
import { isFavorite, toggleFavorite } from './favorites.js';

const detailDialog = document.querySelector(`#strain-dialog`);
const detailContent = document.querySelector(`#strain-dialog-content`);

// The button that opened the detail view, so focus can go back to it
let detailOpener = false;
export const lastDetailOpener = () => detailOpener;

// Called after a favorite changes, so the page can update the list (set by main.js)
let favoriteChanged = () => {};
export const onFavoriteChange = (callback) => { favoriteChanged = callback; };

// ----------------------------------------------------------
// SMALL PIECES
// ----------------------------------------------------------

// A labeled row of tags. Tags that match the search get a highlight
// and the words "matches your search" for screen readers.
// Returns false (nothing) when the list is empty.
const createTagGroup = (title, effects, className, matched, headingTag) => (effects.length === 0 ? false : el(`section`, { class: `tag-group ${className}` },
  el(headingTag, {}, title),
  el(`ul`, { class: `tags` }, effects.map((effect) => {
    const isMatch = matched.includes(effect);
    return el(`li`, { class: isMatch ? `is-match` : false },
      labelFor(effect),
      isMatch ? el(`small`, { class: `visually-hidden` }, ` (matches your search)`) : false);
  })),
));

// The three effect groups for a strain
// headingTag: `h4` on cards (under the strain's h3), `h3` in the detail view (under its h2)
const createEffectGroups = (strain, matched, headingTag) => {
  const { helpsWith, sideEffects, feelings } = groupEffects(strain.effects);
  return [
    createTagGroup(`Predicted to help with`, helpsWith, `tags-helps`, matched, headingTag),
    createTagGroup(`Predicted effects`, feelings, `tags-feelings`, matched, headingTag),
    createTagGroup(`Possible side effects`, sideEffects, `tags-side`, matched, headingTag),
    strain.effects.length === 0 ? el(`p`, { class: `no-effects` }, `No predicted effects listed for this strain.`) : false,
  ];
};

// The photo. If it fails to load, it is removed so no broken image shows.
const createStrainImage = (strain, className) => (strain.imageUrl === `` ? false : el(`img`, {
  src: strain.imageUrl,
  alt: ``, // decorative: the strain name is right next to it
  loading: `lazy`,
  width: 400,
  height: 260,
  class: className,
  onerror: (event) => event.currentTarget.remove(),
}));

// THC and CBD side by side
const createPotency = (strain) => el(`dl`, { class: `potency` },
  el(`dt`, {}, `THC`), el(`dd`, {}, `${strain.totalThc}%`),
  el(`dt`, {}, `CBD`), el(`dd`, {}, `${strain.totalCbd}%`),
);

// What the heart button says. The heart symbol is hidden from screen readers
// (it would be read as "white heart suit"); the strain name is hidden on screen
// but read aloud, so the button is announced as "Save 24K Gold" / "Saved 24K Gold".
// Spoken and visible words match, so voice control ("click Save") works too.
const favoriteButtonContent = (strain, saved) => [
  el(`b`, { class: `heart`, [`aria-hidden`]: `true` }, saved ? `♥ ` : `♡ `),
  saved ? `Saved` : `Save`,
  el(`small`, { class: `visually-hidden` }, ` ${strain.name}`),
];

// Heart button (in the detail view). aria-pressed tells screen readers whether it is saved.
const createFavoriteButton = (strain) => {
  const saved = isFavorite(strain.name);
  return el(`button`, {
    type: `button`,
    class: `favorite-button`,
    [`aria-pressed`]: `${saved}`,
    [`data-strain`]: strain.name,
    onclick: (event) => {
      const nowSaved = toggleFavorite(strain.name);
      const button = event.currentTarget;
      button.setAttribute(`aria-pressed`, `${nowSaved}`);
      button.replaceChildren(...favoriteButtonContent(strain, nowSaved));
      favoriteChanged(strain, nowSaved);
    },
  }, favoriteButtonContent(strain, saved));
};

// ----------------------------------------------------------
// DETAIL VIEW (a <dialog>)
// ----------------------------------------------------------

// Terpenes from highest to lowest, as rows with a bar
const createTerpeneList = (strain) => {
  const sorted = Object.entries(strain.terpenes)
    .filter(([, amount]) => amount > 0)
    .sort((first, second) => second[1] - first[1]);
  if (sorted.length === 0) {
    return el(`p`, { class: `no-effects` }, `No terpene results for this strain.`);
  }
  const highest = sorted[0][1];
  return el(`dl`, { class: `terpene-list` }, sorted.map(([name, amount]) => [
    el(`dt`, {}, name),
    el(`dd`, {},
      // The bar is decoration; the number next to it is what screen readers hear
      el(`meter`, { min: 0, max: highest, value: amount, [`aria-hidden`]: `true` }),
      el(`data`, { value: amount }, `${amount.toFixed(2)}%`)),
  ]));
};

export const openStrainDetail = (strain, matched) => {
  detailOpener = document.activeElement;
  // replaceChildren() would print lists and false as text ("false,[object HTMLElement]"),
  // so flatten the lists and drop the false parts first, the same way el() does
  const parts = [
    createStrainImage(strain, `detail-image`),
    el(`header`, { class: `detail-header` },
      el(`h2`, { id: `strain-dialog-title` }, strain.name),
      createPotency(strain),
    ),
    el(`p`, { class: `detail-actions` }, createFavoriteButton(strain)),
    strain.description ? el(`p`, { class: `detail-description` }, strain.description) : false,
    createEffectGroups(strain, matched, `h3`),
    el(`section`, { class: `tag-group` },
      el(`h3`, {}, `Terpenes`),
      createTerpeneList(strain)),
    strain.aromas.length > 0
      ? el(`section`, { class: `tag-group tags-aromas` },
        el(`h3`, {}, `Aromas`),
        el(`ul`, { class: `tags` }, strain.aromas.map((aroma) => el(`li`, {}, labelFor(aroma)))))
      : false,
    el(`p`, { class: `detail-note` }, `Effects are predicted from lab results, not proven. Talk to your doctor before use.`),
  ];
  detailContent.replaceChildren(...parts.flat(Infinity).filter((part) => part !== false));
  detailDialog.showModal();
};

// ----------------------------------------------------------
// CARDS
// ----------------------------------------------------------

// A safe id from a name: "24K Gold" becomes "strain-24k-gold"
const idFor = (name) => `strain-${name.toLowerCase().replace(/[^a-z0-9]+/g, `-`)}`;

// One strain card. matched = effect labels that matched the search.
// Saving a favorite happens in the detail view, so the card has one button.
const createStrainCard = (strain, matched) => el(`li`, {},
  el(`article`, { class: `strain-card`, [`aria-labelledby`]: idFor(strain.name) },
    createStrainImage(strain, `card-image`),
    el(`header`, { class: `card-header` },
      el(`h3`, { id: idFor(strain.name) }, strain.name),
      createPotency(strain),
    ),
    createEffectGroups(strain, matched, `h4`),
    el(`footer`, { class: `card-actions` },
      el(`button`, {
        type: `button`,
        class: `details-button`,
        [`aria-label`]: `Details for ${strain.name}`,
        onclick: () => openStrainDetail(strain, matched),
      }, `Details`),
    ),
  ),
);

// Draws a list of strains as cards inside the container
export const renderStrains = (strains, container, matched) => {
  container.replaceChildren(...strains.map((strain) => createStrainCard(strain, matched)));
};
