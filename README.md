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
4. Press **Details** on a strain for the full description. Press **♡ Save** there to keep it in your favorites.

## Limits of the data

- 184 strains from Cannlytics, last updated 2023.
- Effects are **predicted** by a model from lab results and user reviews. They are not clinical evidence.
- Only migraines (3 strains) and depression (4) have medical labels. Insomnia, stress, anxiety, fatigue, appetite and
  focus use the closest feeling (sleepy, relaxed, energetic, hungry, focused), and the page says so.
- Symptoms with no matching strains (currently pain, arthritis, seizures, muscle spasms and glaucoma) are not offered.
  They appear automatically if the data adds strains for them.

## Run it on your computer

```
python3 -m http.server 8000
```

Then open http://localhost:8000. No API key is needed.

Data: [Cannlytics](https://cannlytics.com/) · Not medical advice.
