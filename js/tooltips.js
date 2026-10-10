// ==========================================================
// FILE: js/tooltips.js
// WHAT IT DOES: Shows and hides the "What is THC?" / "What is CBD?" tips.
// With a mouse, the tip opens on hover. On a phone, a tap opens or
// closes it. With a keyboard, it opens when the button gets focus.
// Esc, a tap anywhere else, or moving focus away closes it.
// Only one tip is open at a time.
// WHY IT'S BUILT THIS WAY: Phones have no hover, so the button also
// works as a tap-to-open toggle. A tip opened by a click stays open
// ("pinned") until it is closed, so moving the mouse away doesn't hide
// something the person chose to read. Any <button class="tip-button">
// with aria-controls pointing at a hidden tip works, so more tips can be
// added in index.html without changing this file.
// ==========================================================

// A short pause before hiding, so the mouse can move from the button onto the tip
const HIDE_DELAY_MS = 300;

// Closes whichever tip is open, so opening a new one closes the old one
let closeOpenTip = () => {};

const setupTip = (button) => {
  const tip = document.querySelector(`#${button.getAttribute(`aria-controls`)}`);
  let pinned = false;
  let hideTimer = 0;

  const show = () => {
    clearTimeout(hideTimer);
    if (closeOpenTip !== hide) {
      closeOpenTip();
      closeOpenTip = hide;
    }
    tip.hidden = false;
    button.setAttribute(`aria-expanded`, `true`);
  };

  const hide = () => {
    clearTimeout(hideTimer);
    pinned = false;
    tip.hidden = true;
    button.setAttribute(`aria-expanded`, `false`);
  };

  // Hides after a short pause, unless the tip was opened on purpose
  const hideSoon = () => {
    if (!pinned) {
      hideTimer = setTimeout(hide, HIDE_DELAY_MS);
    }
  };

  // Mouse: hover the button or the tip to keep it open.
  // (pointerType check: phones also send pointer events on tap, which the click handles.)
  [button, tip].forEach((part) => {
    part.addEventListener(`pointerenter`, (event) => {
      if (event.pointerType === `mouse`) {
        show();
      }
    });
    part.addEventListener(`pointerleave`, (event) => {
      if (event.pointerType === `mouse`) {
        hideSoon();
      }
    });
  });

  // Tap or click: opens and pins the tip, or closes it if it's already pinned
  button.addEventListener(`click`, () => {
    if (pinned) {
      hide();
    } else {
      show();
      pinned = true;
    }
  });

  // Keyboard: open while the button has focus
  button.addEventListener(`focus`, () => {
    if (button.matches(`:focus-visible`)) {
      show();
    }
  });
  // Moving focus away closes it, so it never covers the next control
  // (unless the mouse is on the tip, e.g. someone is selecting its text)
  button.addEventListener(`blur`, () => {
    if (!tip.matches(`:hover`)) {
      hide();
    }
  });

  // Esc closes the tip (and leaves focus where it is)
  document.addEventListener(`keydown`, (event) => {
    if (event.key === `Escape` && !tip.hidden) {
      hide();
    }
  });

  // A tap or click anywhere else closes it
  document.addEventListener(`pointerdown`, (event) => {
    if (!tip.hidden && !button.contains(event.target) && !tip.contains(event.target)) {
      hide();
    }
  });
};

export const setupTooltips = () => {
  document.querySelectorAll(`.tip-button`).forEach(setupTip);
};
