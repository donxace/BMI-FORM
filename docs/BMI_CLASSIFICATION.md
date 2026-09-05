# BMI Classification Reference

This document is the single source of truth for how BMI-FORM turns a
height/weight measurement into a BMI value, an Ideal Body Weight (IBW),
and two parallel classifications. No code changes were needed for this
revision — the existing thresholds already match published standards.
This file exists so the next person editing
`bmi-assessments.service.ts` doesn't have to reverse-engineer where the
numbers came from.

**Where it's computed:** `backend/src/bmi-assessments/bmi-assessments.service.ts`,
`calculateBmiFields()`. Computed once at assessment time and persisted
(`bmi`, `ibw`, `weight_to_lose`, `pnp_classification`, `who_classification`
columns). The frontend (`Dashboard.tsx`, `Analytics.tsx`) reads
`who_classification` directly rather than re-deriving it from raw BMI —
this is the correct pattern (compare to the VITALYZE sibling app's
`docs/VITAL_SIGN_CLASSIFICATION.md`, which documents a case where the
dashboard *was* re-deriving thresholds independently and had drifted out
of sync with the backend).

---

## 1. BMI

```
BMI = weight(kg) / height(m)²
```

Standard formula, unitless result in kg/m².

---

## 2. WHO Classification (`who_classification`)

| Classification | BMI (kg/m²) |
|---|---|
| Underweight | < 18.5 |
| Normal | 18.5 – 24.9 |
| Overweight | 25.0 – 29.9 |
| Obese | ≥ 30.0 |

**Source:** WHO Technical Report Series 894, *Obesity: Preventing and
Managing the Global Epidemic* (2000) — the standard global adult BMI
classification. This is the general-population reference; see §3 for why
a second, stricter classification also exists.

---

## 3. PNP / WHO Asia-Pacific Classification (`pnp_classification`)

| Classification | BMI (kg/m²) |
|---|---|
| Underweight | < 18.5 |
| Normal | 18.5 – 22.9 |
| Overweight | 23.0 – 24.9 |
| Obese Class I | 25.0 – 29.9 |
| Obese Class II | ≥ 30.0 |

**Source:** WHO Western Pacific Region / International Association for
the Study of Obesity, *The Asia-Pacific Perspective: Redefining Obesity
and its Treatment* (2000). Asian populations show elevated
cardiometabolic risk at lower BMI values than the general WHO cutoffs
capture, so the Asia-Pacific guideline lowers the Normal/Overweight and
Overweight/Obese boundaries. This is the appropriate reference for a
Philippine National Police personnel health-monitoring system and is why
the app tracks two classifications in parallel rather than one:
`who_classification` for the internationally-recognized figure and
`pnp_classification` for the population-appropriate one actually used for
fitness/health decisions.

---

## 4. Ideal Body Weight (`ibw`) and Weight to Lose (`weight_to_lose`)

```
IBW = 22 × height(m)²
weight_to_lose = max(0, weight − IBW)
```

This is the "BMI method" of estimating ideal body weight: BMI 22.0 sits
near the middle of the WHO Normal band (18.5–24.9) and is commonly used
as the reference point for lowest-mortality BMI in general-population
studies, making it a reasonable single target weight to compute against.
This is a simplification — it does not account for frame size, sex, or
age the way the Devine, Hamwi, or Robinson IBW formulas do — but it is
internally consistent with the BMI figure the app already reports, which
those alternative formulas are not (they estimate IBW from height alone
and can disagree with a person's own BMI-normal weight range).

`weight_to_lose` is floored at 0 rather than allowed to go negative, so
someone already at or below their IBW is reported as having no excess
weight rather than a "negative deficit."

---

## Change log

- **This revision** — no threshold changes; added this document. Existing
  `who_classification` and `pnp_classification` cutoffs were verified
  against WHO Technical Report Series 894 and the WHO Asia-Pacific
  redefinition and found to already match exactly.
