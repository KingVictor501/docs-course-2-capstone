// ==========================================================
// FILE: js/dom.js
// WHAT IT DOES: Small helpers the other files share: el() builds page
// elements, and labelFor() turns API labels like "effect_dry_mouth"
// into readable words like "Dry mouth".
// WHY IT'S BUILT THIS WAY: el() skips anything set to false, so other
// files can write `condition ? el(...) : false` instead of if-blocks.
// ==========================================================

// Builds an element.
// el(`p`, { class: `note` }, `Hello`, el(`strong`, {}, `world`))
// - attributes: any HTML attribute; `on<event>` adds a listener;
//   true adds an empty attribute (like hidden); false skips it
// - children: text, numbers, elements or lists of them (false is skipped)
export const el = (tag, attributes = {}, ...children) => {
  const element = document.createElement(tag);

  Object.entries(attributes).forEach(([name, value]) => {
    if (value === false) {
      return;
    }
    if (name.startsWith(`on`) && typeof value === `function`) {
      element.addEventListener(name.slice(2), value);
    } else if (value === true) {
      element.setAttribute(name, ``);
    } else {
      element.setAttribute(name, `${value}`);
    }
  });

  children.flat(Infinity).forEach((child) => {
    if (child !== false && child !== ``) {
      element.append(child instanceof Node ? child : `${child}`);
    }
  });

  return element;
};

// Turns an API label into words: "effect_dry_mouth" becomes "Dry mouth"
export const labelFor = (key) => {
  const words = key.replace(/^(effect|aroma)_/, ``).replace(/_/g, ` `);
  return `${words.charAt(0).toUpperCase()}${words.slice(1)}`;
};
