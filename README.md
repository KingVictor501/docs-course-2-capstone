# Strain Finder (Docs Course 2 Capstone)

Type a symptom (migraine, insomnia, stress…) and see cannabis strains **predicted to help with** it,
using free data from the Cannlytics API. Includes a Florida health and legal notice.

## Run it

```
python3 -m http.server 8000
```

Then open http://localhost:8000. No API key is needed.

## Files

| File | What it does |
|---|---|
| `js/data.js` | Loads the strains (steps 1 and 2: fetch, log, `.map()` to 8 fields). Saved copy for 24 h, backup file if the API is down. |
| `js/symptoms.js` | Symptom words → effect labels (e.g. "can't sleep" → sleepy), and which effects are side effects. |
| `js/cards.js` | Strain cards (step 3) and the detail view. |
| `js/favorites.js` | Favorites saved in the browser. |
| `js/main.js` | Search form, filters, sorting, loading message (step 4), empty results. |
| `data/strains-backup.json` | Copy of the API response, used when Cannlytics is down. |

## Limits of the data

- 184 strains, last updated 2023.
- Effects are predicted by a model from lab results, not clinical evidence.
- Only migraines (3 strains) and depression (4) have medical labels right now. Insomnia, stress, anxiety,
  fatigue, appetite and focus use the closest feeling (sleepy, relaxed, energetic, hungry, focused).
  Pain, arthritis, seizures, muscle spasms and glaucoma have no matching strains yet.
