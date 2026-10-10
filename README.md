# Strain Finder

**Live site:** https://kingvictor501.github.io/docs-course-2-capstone/

## What it does and who it's for

Strain Finder lets you type a health concern in everyday words, like "can't sleep," "migraine" or "feeling down,"
and shows a simple list of cannabis strains predicted to help with it, along with how strong each one is and any
possible side effects. It was made for seniors at the senior center who asked for plain, easy-to-read information
about medical cannabis that they can bring to their doctor. A Florida health notice on every page reminds them that
a doctor's recommendation and a medical marijuana card are required, and that cannabis can interact with their
medications.

## How to use it

1. Type a symptom in the box, or tap one of the **Popular symptoms** buttons.
2. Narrow the list with the **THC**, **CBD** or **Favorites only** filters, and change the order with **Sort by**.
3. Results show 10 strains at a time. Use **Next ›** and **‹ Previous** at the bottom to see more.
4. Press **Details** on a strain for the full description, or **♡ Save** to keep it in your favorites.

## What each file does

| File | What it does |
|---|---|
| `index.html` | The page itself: the search box, filters, the area where strain cards appear, the detail pop-up, and the Florida health and legal notice. |
| `styles.css` | How the page looks: calm green colors, a card grid that fits phones and computers, colored effect tags, the loading spinner and dark mode. |
| `js/main.js` | Runs the page. It checks what was typed, finds the matching symptom, applies filters and sorting, and shows the cards 10 at a time, plus the loading box, "nothing found" help and error messages. |
| `js/data.js` | Gets the strain list from the Cannlytics API, keeps only the 8 fields the cards need, fixes missing THC/CBD totals, and saves a copy so the site works when the API is down. |
| `js/symptoms.js` | Understands everyday words and typos ("brain fog", "my back hurts", "migrane") and matches them to the effects in the data. Keeps helpful effects and side effects apart. |
| `js/cards.js` | Draws each strain card and the detail pop-up with the description, terpenes and aromas. |
| `js/favorites.js` | Remembers the strains someone saved with the heart button. |
| `js/dom.js` | Small shared helpers for building page elements and turning labels like `effect_dry_mouth` into "Dry mouth". |
| `data/strains-backup.json` | A saved copy of the strain data, used only if the API and the browser's saved copy are both unavailable. |

## Code decisions

**Side effects are never shown as benefits.** The API puts every effect in one list, including things a strain can
*cause*, like headaches and anxiety. `symptoms.js` sorts them into "predicted to help with", feelings, and "possible
side effects", and searches leave out strains whose side effects clash with the symptom. A headache search never
suggests a strain that lists headache as a side effect. For seniors, showing a headache-causing strain as a headache
remedy would be a real harm, so this rule is built into the matching instead of left to the display.

**The site keeps working when the data source doesn't.** `data.js` tries four sources in order: a copy saved in the
browser in the last 24 hours, the live Cannlytics API, an older saved copy, and finally a backup file inside the
project. The footer says which one is showing. This also means repeat visits load instantly without calling the API.

**Fixing the data, not just showing it.** About half the strains had a total THC of 0 in the API even though their lab
results had THC. `data.js` fills in the total with the standard lab formula (THC + 87.7% of THCA), so 24K Gold shows
21.5% instead of 0%.

**Text from the API can never run as code.** Cards are built with a small `el()` helper instead of `innerHTML`, so a
strain description containing HTML is always shown as plain text.

## Limits of the data

- 184 strains from Cannlytics, last updated 2023.
- Effects are **predicted** by a model from lab results and user reviews. They are not clinical evidence.
- Only migraines (3 strains) and depression (4) have medical labels. Insomnia, stress, anxiety, fatigue, appetite and
  focus use the closest feeling (sleepy, relaxed, energetic, hungry, focused), and the page says so.
- Pain, nausea, arthritis, seizures, muscle spasms and glaucoma have no matching strains yet; the page explains this
  instead of guessing.

## Run it on your computer

```
python3 -m http.server 8000
```

Then open http://localhost:8000. No API key is needed.

Data: [Cannlytics](https://cannlytics.com/) · Not medical advice.
