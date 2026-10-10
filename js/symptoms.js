// ==========================================================
// FILE: js/symptoms.js
// WHAT IT DOES: Understands what people type. It turns everyday words
// ("can't sleep", "brain fog", "my back hurts", typos like "migrane")
// into the effect labels in the data, and finds the strains that match.
// WHY IT'S BUILT THIS WAY: The API mixes helpful effects and side effects
// in one list, so this file sorts them into groups. That way a strain that
// CAUSES headaches is never shown as helping with headaches.
// ==========================================================

// ----------------------------------------------------------
// EFFECT GROUPS
// The API puts every effect in one list. We split them into three
// groups so side effects are never shown as something a strain helps with.
// ----------------------------------------------------------

// Symptoms and conditions: shown as "Predicted to help with"
export const MEDICAL_EFFECTS = [
  `effect_migraines`, `effect_depression`, `effect_pain`, `effect_stress`, `effect_fatigue`,
  `effect_arthritis`, `effect_epilepsy`, `effect_seizures`, `effect_spasticity`, `effect_eye_pressure`,
];

// Unwanted effects a strain may cause: shown as "Possible side effects"
export const SIDE_EFFECTS = [
  `effect_dry_mouth`, `effect_dry_eyes`, `effect_dizzy`, `effect_paranoid`, `effect_anxious`, `effect_headache`,
];

// Everything else (relaxed, happy, sleepy...) is a feeling: "Predicted effects"
export const groupEffects = (effects) => ({
  helpsWith: effects.filter((effect) => MEDICAL_EFFECTS.includes(effect)),
  sideEffects: effects.filter((effect) => SIDE_EFFECTS.includes(effect)),
  feelings: effects.filter((effect) => !MEDICAL_EFFECTS.includes(effect) && !SIDE_EFFECTS.includes(effect)),
});

// ----------------------------------------------------------
// SYMPTOM LIST
// name:    what the suggestion list shows
// terms:   words and phrases people might type for it
// effects: effect labels that count as a match
// avoid:   strains with these side effects are left out
// via:     when the match is a feeling (not a medical label), we say so
// To support a new way of saying something, add it to terms.
// ----------------------------------------------------------

export const SYMPTOMS = [
  {
    name: `Migraines`,
    terms: [
      `migraine`, `migraines`, `headache`, `headaches`, `head ache`, `head pain`, `head hurts`,
      `cluster headache`, `tension headache`, `sinus headache`, `throbbing head`, `pounding head`, `aura`,
    ],
    effects: [`effect_migraines`],
    avoid: [`effect_headache`],
  },
  {
    name: `Insomnia`,
    terms: [
      `insomnia`, `cant sleep`, `cannot sleep`, `trouble sleeping`, `sleep`, `sleeping`, `sleepless`,
      `sleeplessness`, `sleep problems`, `restless nights`, `staying asleep`, `falling asleep`,
      `wake up at night`, `waking up at night`, `up all night`, `bedtime`,
    ],
    effects: [`effect_sleepy`],
    via: `sleepy`,
  },
  {
    name: `Depression`,
    terms: [
      `depression`, `depressed`, `low mood`, `bad mood`, `sad`, `sadness`, `feeling down`, `down`,
      `hopeless`, `blue`, `the blues`, `melancholy`, `unhappy`, `seasonal depression`, `seasonal affective`,
    ],
    effects: [`effect_depression`],
  },
  {
    name: `Stress`,
    terms: [
      `stress`, `stressed`, `stressed out`, `tension`, `tense`, `overwhelmed`, `burnout`, `burned out`,
      `burnt out`, `wound up`, `pressure`, `relax`, `relaxation`, `unwind`, `calm`, `calm down`,
    ],
    effects: [`effect_stress`, `effect_relaxed`],
    avoid: [`effect_anxious`, `effect_paranoid`],
    via: `relaxed`,
  },
  {
    name: `Anxiety`,
    terms: [
      `anxiety`, `anxious`, `nervous`, `nerves`, `worry`, `worried`, `worrying`, `panic`, `panic attack`,
      `panic attacks`, `social anxiety`, `racing thoughts`, `racing mind`, `on edge`, `jittery`, `ptsd`, `trauma`,
    ],
    effects: [`effect_stress`, `effect_relaxed`],
    avoid: [`effect_anxious`, `effect_paranoid`],
    via: `relaxed`,
  },
  {
    name: `Fatigue`,
    terms: [
      `fatigue`, `tired`, `tiredness`, `exhausted`, `exhaustion`, `low energy`, `no energy`, `lack of energy`,
      `lethargy`, `lethargic`, `sluggish`, `worn out`, `run down`, `chronic fatigue`, `weak`, `weakness`,
    ],
    effects: [`effect_fatigue`, `effect_energetic`],
    via: `energetic`,
  },
  {
    name: `Loss of appetite`,
    terms: [
      `appetite`, `loss of appetite`, `no appetite`, `poor appetite`, `low appetite`, `not hungry`,
      `cant eat`, `trouble eating`, `weight loss`, `losing weight`, `anorexia`, `munchies`,
    ],
    effects: [`effect_hungry`],
    via: `hungry`,
  },
  {
    name: `Trouble focusing`,
    terms: [
      `focus`, `focusing`, `trouble focusing`, `concentration`, `concentrate`, `cant concentrate`,
      `brain fog`, `foggy`, `mental fog`, `foggy brain`, `fuzzy`, `cant think`, `cant think straight`,
      `adhd`, `add`, `distracted`, `easily distracted`, `attention`, `short attention span`, `scattered`,
      `unfocused`, `forgetful`, `mental clarity`, `clarity`,
    ],
    effects: [`effect_focused`],
    avoid: [`effect_dizzy`],
    via: `focused`,
  },
  {
    name: `Pain`,
    terms: [
      `pain`, `chronic pain`, `back pain`, `lower back pain`, `upper back pain`, `neck pain`, `shoulder pain`,
      `hip pain`, `knee pain`, `leg pain`, `nerve pain`, `neuropathy`, `sciatica`, `ache`, `aches`, `aching`,
      `body aches`, `sore`, `soreness`, `sore muscles`, `cramps`, `menstrual cramps`, `period pain`,
      `fibromyalgia`, `injury`, `hurt`, `hurts`, `inflammation`, `inflamed`,
    ],
    effects: [`effect_pain`],
  },
  {
    name: `Arthritis`,
    terms: [`arthritis`, `joint pain`, `joints`, `stiff joints`, `rheumatoid`, `osteoarthritis`, `gout`],
    effects: [`effect_arthritis`],
  },
  {
    name: `Seizures`,
    terms: [`seizures`, `seizure`, `epilepsy`, `epileptic`, `convulsions`],
    effects: [`effect_seizures`, `effect_epilepsy`],
  },
  {
    name: `Muscle spasms`,
    terms: [
      `muscle spasms`, `muscle spasm`, `spasms`, `spasm`, `spasticity`, `muscle cramps`, `muscle tension`,
      `tight muscles`, `twitching`, `tremors`, `multiple sclerosis`,
    ],
    effects: [`effect_spasticity`],
  },
  {
    name: `Glaucoma`,
    terms: [`glaucoma`, `eye pressure`],
    effects: [`effect_eye_pressure`],
  },
];

// ----------------------------------------------------------
// MATCHING
// Tries, in order:
//   1. an exact name or phrase              "insomnia", "brain fog"
//   2. a known phrase inside a longer one   "really bad lower back pain"
//   3. single words, ignoring endings       "migraines" = "migraine", "sleeping" = "sleep"
//      and small typos                      "insomina", "migrane"
//   4. the start of a word while typing     "insom"
// ----------------------------------------------------------

// "Can't Sleep!" becomes "cant sleep"
const normalize = (text) => text.toLowerCase().replace(/[^a-z\s]/g, ``).replace(/\s+/g, ` `).trim();

// Words that don't tell us which symptom it is
const FILLER_WORDS = [
  `i`, `im`, `ive`, `my`, `me`, `a`, `an`, `the`, `and`, `or`, `of`, `to`, `in`, `on`, `at`, `for`, `with`,
  `have`, `has`, `having`, `get`, `getting`, `got`, `feel`, `feeling`, `feels`, `really`, `very`, `so`, `too`,
  `bad`, `severe`, `mild`, `constant`, `chronic`, `always`, `lot`, `lots`, `some`, `help`, `helps`, `relief`,
  `from`, `after`, `lower`, `upper`, `trouble`, `problem`, `problems`, `issues`, `kind`, `bit`,
];

// Trims common endings so different forms of a word match:
// "migraines" -> "migraine", "sleeping" -> "sleep", "stressed" -> "stress", "tiredness" -> "tired"
const stem = (word) => {
  const endings = [`ness`, `ing`, `ed`, `ly`, `s`];
  const ending = endings.find((suffix) => word.endsWith(suffix) && word.length - suffix.length >= 3 && !word.endsWith(`ss`));
  return ending ? word.slice(0, -ending.length) : word;
};

// The important words of a phrase, trimmed
const keyWords = (text) => normalize(text).split(` `).filter((word) => word !== `` && !FILLER_WORDS.includes(word)).map(stem);

// How many single-letter changes turn one word into the other ("migrane" -> "migraine" is 1)
const editDistance = (first, second) => {
  const previous = Array.from({ length: second.length + 1 }, (item, index) => index);
  [...first].forEach((letter, row) => {
    let diagonal = previous[0];
    previous[0] = row + 1;
    [...second].forEach((otherLetter, column) => {
      const above = previous[column + 1];
      previous[column + 1] = Math.min(above + 1, previous[column] + 1, diagonal + (letter === otherLetter ? 0 : 1));
      diagonal = above;
    });
  });
  return previous[second.length];
};

// Two words match if they are the same, or close enough to be a typo.
// Short words must be exact; longer words allow 1 typo (2 for 8+ letters).
const wordsMatch = (typed, known) => {
  if (typed === known) {
    return true;
  }
  if (typed.length < 5 || known.length < 5) {
    return false;
  }
  return editDistance(typed, known) <= (known.length >= 8 ? 2 : 1);
};

// True if a phrase appears in the text as whole words ("back pain" in "bad back pain", not "pain" in "painting")
const containsPhrase = (text, phrase) => ` ${text} `.includes(` ${phrase} `);

// Finds the symptom for what was typed, or false if it isn't one we know
export const findSymptom = (text) => {
  const typed = normalize(text);
  if (typed === ``) {
    return false;
  }

  // 1. Exact name or phrase
  const exact = SYMPTOMS.find((symptom) => normalize(symptom.name) === typed || symptom.terms.includes(typed));
  if (exact) {
    return exact;
  }

  // 2. A known phrase inside what they typed. The longest phrase wins,
  //    so "joint pain" (arthritis) beats "pain".
  const phraseMatches = SYMPTOMS.flatMap((symptom) => symptom.terms
    .filter((term) => containsPhrase(typed, term))
    .map((term) => ({ symptom, length: term.length })));
  if (phraseMatches.length > 0) {
    return phraseMatches.sort((first, second) => second.length - first.length)[0].symptom;
  }

  // 3. Word by word, ignoring endings and small typos.
  //    Each symptom scores a point for every typed word it recognizes.
  const typedWords = keyWords(typed);
  const scored = SYMPTOMS.map((symptom) => {
    const knownWords = [...new Set(symptom.terms.flatMap(keyWords).concat(keyWords(symptom.name)))];
    const score = typedWords.filter((word) => knownWords.some((known) => wordsMatch(word, known))).length;
    return { symptom, score };
  }).filter(({ score }) => score > 0);
  if (scored.length > 0) {
    return scored.sort((first, second) => second.score - first.score)[0].symptom;
  }

  // 4. The start of a word while typing ("insom"). Needs 3+ letters so "pa" doesn't guess wrong.
  if (typed.length >= 3) {
    const partial = SYMPTOMS.find((symptom) => [symptom.name.toLowerCase(), ...symptom.terms].some((term) => term.startsWith(typed)));
    if (partial) {
      return partial;
    }
  }

  return false;
};

// Strains predicted to help with a symptom (side-effect conflicts are left out)
export const strainsForSymptom = (strains, symptom) => strains.filter((strain) =>
  strain.effects.some((effect) => symptom.effects.includes(effect))
  && !strain.effects.some((effect) => (symptom.avoid || []).includes(effect)));

// How many strains match each symptom, biggest first (for the quick-pick buttons)
export const symptomCounts = (strains) => SYMPTOMS
  .map((symptom) => ({ symptom, count: strainsForSymptom(strains, symptom).length }))
  .sort((first, second) => second.count - first.count);

// Only the symptoms that have at least one matching strain.
// Symptoms with no strains are left out of suggestions and searches,
// and come back on their own if the data ever adds strains for them.
export const availableSymptoms = (strains) =>
  SYMPTOMS.filter((symptom) => strainsForSymptom(strains, symptom).length > 0);
