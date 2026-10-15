/*
 * =========================================================
 * BMI INSIGHTS -- PURE LOGIC
 *
 * Everything here is deterministic and needs no model: the statistics
 * the dashboard insight is built from, the rule-based wording used when
 * no local AI model is available (or it fails), the prompts sent to the
 * model, and the strict parsing of what it sends back.
 *
 * Nothing in this file (or sent to the model) identifies a person: only
 * counts, averages, office names and assessment numbers.
 * =========================================================
 */

export type WhoLabel = 'Underweight' | 'Normal' | 'Overweight' | 'Obese';

// Labels getPnpClassification in bmi-assessments.service.ts produces, plus
// plain 'Obese' found on older records (no class recorded).
export const PNP_LABELS = [
  'Severely Underweight',
  'Underweight',
  'Normal',
  'Acceptable BMI',
  'Overweight',
  'Obese',
  'Obese Class 1',
  'Obese Class 2',
  'Obese Class 3',
] as const;

export type PnpLabel = (typeof PNP_LABELS)[number];

/** Where an assessment stands against the PNP acceptable BMI for the person's age. */
export type PnpStanding = 'within' | 'above' | 'underweight' | 'unknown';

export type InsightRow = {
  assessment_id: number | string;
  personnel_id: number | string;
  height: number | string | null;
  weight: number | string | null;
  waist: number | string | null;
  bmi: number | string | null;
  weight_to_lose: number | string | null;
  pnp_classification: string | null;
  who_classification: string | null;
  // 'YYYY-MM-DD'
  assessment_date: string;
  office: string | null;
  age: number | string | null;
};

export type WhoDistribution = Record<WhoLabel | 'Unknown', number>;
export type PnpDistribution = Record<PnpLabel | 'Unknown', number>;

/**
 * What the dashboard is showing: a date range. Dates are 'YYYY-MM-DD';
 * `to` is exclusive. Both null = every record.
 */
export type InsightScope = {
  from: string | null;
  to: string | null;
};

export type ScopeInfo = {
  label: string;
  from: string | null;
  to: string | null;
};

export type PreviousWindow = { from: string; to: string; label: string };

export type OfficeStat = {
  office: string;
  personnel: number;
  above: number;
  percent: number;
};

export type DashboardStats = {
  scope: ScopeInfo;
  // Per assessment, like the dashboard's stat cards.
  total: number;
  who: WhoDistribution;
  attention: { count: number; percent: number };
  averages: { bmi: number | null; weight: number | null; waist: number | null };
  // Per person, from each person's latest assessment in the period.
  personnel: number;
  pnp: PnpDistribution;
  standing: Record<PnpStanding, number>;
  priority: { obese_class_2_3: number; severely_underweight: number };
  weight_to_lose: { personnel: number; average: number | null; total: number | null };
  offices: OfficeStat[];
  progress: {
    basis: 'previous' | 'first';
    reassessed: number;
    improved: number;
    worsened: number;
    unchanged: number;
    average_weight_change: number | null;
  } | null;
  previous: {
    label: string;
    total: number;
    attention_percent: number;
    average_bmi: number | null;
  } | null;
  data_quality: {
    out_of_range: { count: number; examples: string[] };
    bmi_mismatch: { count: number; examples: string[] };
    missing_age: number;
  };
};

export type DashboardInsights = {
  summary: string;
  findings: string[];
  suggestions: string[];
};

/* ------------------------------------------------------------ helpers */

const num = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

const percentOf = (part: number, whole: number) =>
  whole > 0 ? round1((part / whole) * 100) : 0;

const average = (values: (number | null)[]): number | null => {
  const present = values.filter((v): v is number => v !== null);
  if (present.length === 0) return null;
  return round1(present.reduce((a, b) => a + b, 0) / present.length);
};

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

// Readings outside these limits are measurement or encoding errors, not
// data: they are flagged and left out of the averages.
export const MEASUREMENT_LIMITS = {
  height: { min: 100, max: 230, unit: 'cm' },
  weight: { min: 25, max: 250, unit: 'kg' },
  bmi: { min: 10, max: 70, unit: 'kg/m²' },
} as const;

type LimitKey = keyof typeof MEASUREMENT_LIMITS;

const LIMIT_LABEL: Record<LimitKey, string> = {
  height: 'height',
  weight: 'weight',
  bmi: 'BMI',
};

export function measurementProblems(row: InsightRow): string[] {
  const problems: string[] = [];

  (Object.keys(MEASUREMENT_LIMITS) as LimitKey[]).forEach((key) => {
    const value = num(row[key]);
    const limit = MEASUREMENT_LIMITS[key];

    if (value !== null && (value < limit.min || value > limit.max)) {
      problems.push(
        `${LIMIT_LABEL[key]} ${value} ${limit.unit} is outside ${limit.min}–${limit.max} ${limit.unit}.`,
      );
    }
  });

  return problems;
}

const isValid = (row: InsightRow) => measurementProblems(row).length === 0;

/**
 * Stored BMI that does not match the stored height and weight (more than
 * 0.5 apart) points at a mistyped height or weight.
 */
export function bmiMismatch(row: InsightRow): number | null {
  const height = num(row.height);
  const weight = num(row.weight);
  const bmi = num(row.bmi);

  if (height === null || weight === null || bmi === null || height <= 0) return null;

  const expected = weight / (height / 100) ** 2;
  return Math.abs(expected - bmi) > 0.5 ? round1(expected) : null;
}

/** Stored WHO classification, or one worked out from the BMI when missing. */
export function whoCategory(row: InsightRow): WhoLabel | null {
  const value = row.who_classification?.toLowerCase().trim();

  if (value) {
    if (value.includes('underweight')) return 'Underweight';
    if (value.includes('overweight')) return 'Overweight';
    if (value.includes('obese') || value.includes('obesity')) return 'Obese';
    if (value.includes('normal')) return 'Normal';
  }

  // Same cutoffs as calculateBmiFields in bmi-assessments.service.ts.
  const bmi = num(row.bmi);
  if (bmi === null) return null;
  if (bmi < 18.5) return 'Underweight';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Overweight';
  return 'Obese';
}

const ROMAN_CLASS: Record<string, string> = { i: '1', ii: '2', iii: '3' };

export function pnpLabel(value: string | null): PnpLabel | null {
  // Older records write the class in Roman numerals ("Obese Class I").
  const text = value
    ?.trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^obese class (iii|ii|i)$/, (_, roman: string) => `obese class ${ROMAN_CLASS[roman]}`);
  if (!text) return null;
  return PNP_LABELS.find((label) => label.toLowerCase() === text) ?? null;
}

export function pnpStanding(label: PnpLabel | null): PnpStanding {
  switch (label) {
    case 'Severely Underweight':
    case 'Underweight':
      return 'underweight';
    case 'Normal':
    case 'Acceptable BMI':
      return 'within';
    case 'Overweight':
    case 'Obese':
    case 'Obese Class 1':
    case 'Obese Class 2':
    case 'Obese Class 3':
      return 'above';
    default:
      return 'unknown';
  }
}

/**
 * How far a classification is from the PNP standard: 0 within it, higher
 * the further away. Used to tell whether a re-assessed person improved.
 */
const PNP_DISTANCE: Record<PnpLabel, number> = {
  'Severely Underweight': 2,
  Underweight: 1,
  Normal: 0,
  'Acceptable BMI': 0,
  Overweight: 1,
  Obese: 2,
  'Obese Class 1': 2,
  'Obese Class 2': 3,
  'Obese Class 3': 4,
};

const WHO_DISTANCE: Record<WhoLabel, number> = {
  Underweight: 1,
  Normal: 0,
  Overweight: 1,
  Obese: 2,
};

const distance = (row: InsightRow): number | null => {
  const pnp = pnpLabel(row.pnp_classification);
  if (pnp) return PNP_DISTANCE[pnp];

  const who = whoCategory(row);
  return who ? WHO_DISTANCE[who] : null;
};

const isAttention = (row: InsightRow) => {
  const who = whoCategory(row);
  return who !== null && who !== 'Normal';
};

const emptyWho = (): WhoDistribution => ({
  Underweight: 0,
  Normal: 0,
  Overweight: 0,
  Obese: 0,
  Unknown: 0,
});

const emptyPnp = (): PnpDistribution => {
  const dist = { Unknown: 0 } as PnpDistribution;
  PNP_LABELS.forEach((label) => (dist[label] = 0));
  return dist;
};

// Later date wins; on the same day the higher assessment id wins.
const isLater = (a: InsightRow, b: InsightRow) =>
  a.assessment_date !== b.assessment_date
    ? a.assessment_date > b.assessment_date
    : Number(a.assessment_id) > Number(b.assessment_id);

/** Each person's latest (or earliest) assessment in `rows`. */
export function pickPerPersonnel(
  rows: InsightRow[],
  which: 'latest' | 'earliest',
): Map<string, InsightRow> {
  const picked = new Map<string, InsightRow>();

  for (const row of rows) {
    const key = String(row.personnel_id);
    const current = picked.get(key);

    if (!current || (which === 'latest' ? isLater(row, current) : isLater(current, row))) {
      picked.set(key, row);
    }
  }

  return picked;
}

/* ------------------------------------------------------- scope helpers */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MONTH_SHORT = MONTH_NAMES.map((m) => m.slice(0, 3));

const DAY_MS = 86_400_000;

const parseIso = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d, ms: Date.UTC(y, m - 1, d) };
};

const toIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

const addDays = (iso: string, days: number) => toIso(parseIso(iso).ms + days * DAY_MS);

const diffDays = (fromIso: string, toIso_: string) =>
  Math.round((parseIso(toIso_).ms - parseIso(fromIso).ms) / DAY_MS);

const formatDay = (iso: string) => {
  const { y, m, d } = parseIso(iso);
  return `${d} ${MONTH_SHORT[m - 1]} ${y}`;
};

const monthLabel = (iso: string) => {
  const { y, m } = parseIso(iso);
  return `${MONTH_NAMES[m - 1]} ${y}`;
};

/** True when [from, to) is exactly one calendar month. */
export function isCalendarMonth(from: string | null, to: string | null): boolean {
  if (!from || !to) return false;
  const a = parseIso(from);
  const b = parseIso(to);
  if (a.d !== 1 || b.d !== 1) return false;
  return b.y * 12 + b.m === a.y * 12 + a.m + 1;
}

/** Short name of the period: "September 2026", "all records". */
export function periodLabel(scope: InsightScope): string {
  if (isCalendarMonth(scope.from, scope.to)) return monthLabel(scope.from as string);
  if (scope.from && scope.to) {
    return `${formatDay(scope.from)} to ${formatDay(addDays(scope.to, -1))}`;
  }
  if (scope.from) return `since ${formatDay(scope.from)}`;
  if (scope.to) return `before ${formatDay(scope.to)}`;
  return 'all records';
}

/** Sentence fragment: "in September 2026", "across all records". */
export function wherePhrase(label: string): string {
  if (label === 'all records') return 'across all records';
  if (label.startsWith('since ') || label.startsWith('before ')) return label;
  return `in ${label}`;
}

/**
 * The window right before the scope, used for the trend. A calendar month
 * compares with the previous calendar month; any other range compares with
 * the same number of days before it. "All records" has no previous window.
 */
export function previousWindow(scope: InsightScope, todayIso: string): PreviousWindow | null {
  if (scope.from && scope.to) {
    if (isCalendarMonth(scope.from, scope.to)) {
      const { y, m } = parseIso(scope.from);
      const prevYear = m === 1 ? y - 1 : y;
      const prevMonth = m === 1 ? 12 : m - 1;
      const from = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
      return { from, to: scope.from, label: monthLabel(from) };
    }

    const length = diffDays(scope.from, scope.to);
    return {
      from: addDays(scope.from, -length),
      to: scope.from,
      label: `the previous ${length} days`,
    };
  }

  if (scope.from) {
    const length = Math.max(1, diffDays(scope.from, todayIso) + 1);
    return {
      from: addDays(scope.from, -length),
      to: scope.from,
      label: `the previous ${length} days`,
    };
  }

  return null;
}

/* -------------------------------------------------------------- stats */

const MIN_OFFICE_PERSONNEL = 3;
const MAX_EXAMPLES = 5;

/**
 * @param rows      assessments in the scope
 * @param previous  assessments in the previous window (trend), if any
 * @param baseline  for a scope with a start date: assessments before it of
 *                  the same personnel, used to tell who improved. Ignored
 *                  for "all records", where each person's first assessment
 *                  is the baseline.
 */
export function buildDashboardStats(
  rows: InsightRow[],
  previous: { rows: InsightRow[]; label: string } | null,
  baseline: InsightRow[],
  scope: InsightScope,
): DashboardStats {
  const who = emptyWho();
  const pnp = emptyPnp();
  const standing: Record<PnpStanding, number> = {
    within: 0,
    above: 0,
    underweight: 0,
    unknown: 0,
  };

  const outOfRange = { count: 0, examples: [] as string[] };
  const mismatch = { count: 0, examples: [] as string[] };

  for (const row of rows) {
    who[whoCategory(row) ?? 'Unknown'] += 1;

    const problems = measurementProblems(row);
    if (problems.length > 0) {
      outOfRange.count += 1;
      if (outOfRange.examples.length < MAX_EXAMPLES) {
        outOfRange.examples.push(`Assessment #${row.assessment_id}: ${problems.join(' ')}`);
      }
      continue;
    }

    const expected = bmiMismatch(row);
    if (expected !== null) {
      mismatch.count += 1;
      if (mismatch.examples.length < MAX_EXAMPLES) {
        mismatch.examples.push(
          `Assessment #${row.assessment_id}: stored BMI ${num(row.bmi)} but height and weight give ${expected}.`,
        );
      }
    }
  }

  const attentionCount = rows.filter(isAttention).length;
  const validRows = rows.filter(isValid);

  // Where each person stands now: their latest assessment in the period.
  const latest = [...pickPerPersonnel(rows, 'latest').values()];

  let obese23 = 0;
  let severelyUnderweight = 0;
  let missingAge = 0;
  const toLose: number[] = [];
  const offices = new Map<string, { personnel: number; above: number }>();

  for (const row of latest) {
    const label = pnpLabel(row.pnp_classification);
    const stand = pnpStanding(label);

    pnp[label ?? 'Unknown'] += 1;
    standing[stand] += 1;

    if (label === 'Obese Class 2' || label === 'Obese Class 3') obese23 += 1;
    if (label === 'Severely Underweight') severelyUnderweight += 1;
    if (num(row.age) === null) missingAge += 1;

    const lose = num(row.weight_to_lose);
    if (stand === 'above' && lose !== null && lose > 0 && isValid(row)) {
      toLose.push(lose);
    }

    const office = row.office?.trim();
    if (office) {
      const entry = offices.get(office) ?? { personnel: 0, above: 0 };
      entry.personnel += 1;
      if (stand === 'above') entry.above += 1;
      offices.set(office, entry);
    }
  }

  const officeStats: OfficeStat[] = [...offices.entries()]
    .filter(([, o]) => o.personnel >= MIN_OFFICE_PERSONNEL && o.above > 0)
    .map(([office, o]) => ({
      office,
      personnel: o.personnel,
      above: o.above,
      percent: percentOf(o.above, o.personnel),
    }))
    .sort((a, b) => b.percent - a.percent || b.above - a.above)
    .slice(0, 3);

  return {
    scope: {
      label: periodLabel(scope),
      from: scope.from,
      to: scope.to,
    },
    total: rows.length,
    who,
    attention: { count: attentionCount, percent: percentOf(attentionCount, rows.length) },
    averages: {
      bmi: average(validRows.map((r) => num(r.bmi))),
      weight: average(validRows.map((r) => num(r.weight))),
      waist: average(validRows.map((r) => num(r.waist))),
    },
    personnel: latest.length,
    pnp,
    standing,
    priority: { obese_class_2_3: obese23, severely_underweight: severelyUnderweight },
    weight_to_lose: {
      personnel: toLose.length,
      average: average(toLose),
      total: toLose.length ? round1(toLose.reduce((a, b) => a + b, 0)) : null,
    },
    offices: officeStats,
    progress: buildProgress(rows, latest, baseline, scope),
    previous:
      previous && previous.rows.length > 0
        ? {
            label: previous.label,
            total: previous.rows.length,
            attention_percent: percentOf(
              previous.rows.filter(isAttention).length,
              previous.rows.length,
            ),
            average_bmi: average(previous.rows.filter(isValid).map((r) => num(r.bmi))),
          }
        : null,
    data_quality: {
      out_of_range: outOfRange,
      bmi_mismatch: mismatch,
      missing_age: missingAge,
    },
  };
}

function buildProgress(
  rows: InsightRow[],
  latest: InsightRow[],
  baseline: InsightRow[],
  scope: InsightScope,
): DashboardStats['progress'] {
  // With a start date, compare with each person's last assessment before
  // it; for "all records", with each person's first assessment.
  const basis = scope.from ? 'previous' : 'first';
  const before =
    basis === 'previous'
      ? pickPerPersonnel(baseline, 'latest')
      : pickPerPersonnel(rows, 'earliest');

  let improved = 0;
  let worsened = 0;
  let unchanged = 0;
  const weightChanges: number[] = [];

  for (const now of latest) {
    const then = before.get(String(now.personnel_id));
    if (!then || then.assessment_id === now.assessment_id) continue;
    if (!isValid(now) || !isValid(then)) continue;

    const a = distance(then);
    const b = distance(now);
    if (a === null || b === null) continue;

    if (b < a) improved += 1;
    else if (b > a) worsened += 1;
    else unchanged += 1;

    const w0 = num(then.weight);
    const w1 = num(now.weight);
    if (w0 !== null && w1 !== null) weightChanges.push(w1 - w0);
  }

  const reassessed = improved + worsened + unchanged;
  if (reassessed === 0) return null;

  return {
    basis,
    reassessed,
    improved,
    worsened,
    unchanged,
    average_weight_change: average(weightChanges),
  };
}

/* ------------------------------------------------- rule-based dashboard text */

export function dataQualityNotes(stats: DashboardStats): string[] {
  const notes: string[] = [];
  const dq = stats.data_quality;

  if (dq.out_of_range.count > 0) {
    const shown = dq.out_of_range.examples.length;
    notes.push(
      `${dq.out_of_range.count} ${plural(dq.out_of_range.count, 'assessment has', 'assessments have')} a measurement outside the plausible range and should be re-measured (left out of the averages)${
        shown < dq.out_of_range.count ? `; first ${shown} shown` : ''
      }:`,
    );
    notes.push(...dq.out_of_range.examples);
  }

  if (dq.bmi_mismatch.count > 0) {
    const shown = dq.bmi_mismatch.examples.length;
    notes.push(
      `${dq.bmi_mismatch.count} ${plural(dq.bmi_mismatch.count, 'assessment has a BMI', 'assessments have a BMI')} that does not match the recorded height and weight; check for a mistyped value${
        shown < dq.bmi_mismatch.count ? ` (first ${shown} shown)` : ''
      }:`,
    );
    notes.push(...dq.bmi_mismatch.examples);
  }

  if (dq.missing_age > 0) {
    notes.push(
      `${dq.missing_age} ${plural(dq.missing_age, 'person has', 'personnel have')} no age on file, so the PNP acceptable BMI was judged with the strictest (29 and below) age band.`,
    );
  }

  return notes;
}

const signed = (n: number) => (n > 0 ? `+${n}` : `${n}`);

export function rulesDashboardInsights(stats: DashboardStats): DashboardInsights {
  const where = wherePhrase(stats.scope.label);

  if (stats.total === 0) {
    return {
      summary: `No BMI assessments were recorded ${where}.`,
      findings: [],
      suggestions: ['Schedule BMI assessments so each unit’s duty fitness can be tracked month to month.'],
    };
  }

  const { standing, personnel } = stats;
  const graded = standing.within + standing.above + standing.underweight;

  let summary =
    graded === 0
      ? `${personnel} ${plural(personnel, 'person was', 'personnel were')} assessed ${where}, but none has a PNP classification on record.`
      : `Of ${personnel} ${plural(personnel, 'person', 'personnel')} assessed ${where}, ${standing.within} (${percentOf(standing.within, personnel)}%) ${plural(standing.within, 'is', 'are')} within the PNP acceptable BMI for their age, ${standing.above} (${percentOf(standing.above, personnel)}%) ${plural(standing.above, 'is', 'are')} above it and ${standing.underweight} ${plural(standing.underweight, 'is', 'are')} underweight.`;

  if (stats.averages.bmi !== null) {
    summary += ` Average BMI was ${stats.averages.bmi} kg/m².`;
  }

  const findings: string[] = [];
  const { priority } = stats;

  if (priority.obese_class_2_3 > 0 || priority.severely_underweight > 0) {
    const parts: string[] = [];
    if (priority.obese_class_2_3 > 0) parts.push(`${priority.obese_class_2_3} in Obese Class 2 or 3`);
    if (priority.severely_underweight > 0) parts.push(`${priority.severely_underweight} severely underweight`);
    findings.push(`Highest-priority cases: ${parts.join(' and ')}.`);
  }

  const wtl = stats.weight_to_lose;
  if (wtl.personnel > 0 && wtl.average !== null && wtl.total !== null) {
    findings.push(
      `The ${wtl.personnel} ${plural(wtl.personnel, 'person', 'personnel')} above the standard need to lose an average of ${wtl.average} kg to reach their ideal body weight (${wtl.total} kg combined).`,
    );
  }

  if (stats.offices.length > 0) {
    findings.push(
      `Offices with the highest share above the standard: ${stats.offices
        .map((o) => `${o.office} (${o.above} of ${o.personnel}, ${o.percent}%)`)
        .join('; ')}.`,
    );
  }

  const p = stats.progress;
  if (p) {
    const against =
      p.basis === 'previous' ? 'compared with their previous assessment' : 'since their first assessment';
    const change =
      p.average_weight_change !== null ? `, average weight change ${signed(p.average_weight_change)} kg` : '';
    findings.push(
      `Of ${p.reassessed} re-assessed ${plural(p.reassessed, 'person', 'personnel')}, ${p.improved} improved, ${p.worsened} worsened and ${p.unchanged} stayed in the same classification ${against}${change}.`,
    );
  }

  if (stats.previous && stats.previous.total >= 5) {
    const diff = round1(stats.attention.percent - stats.previous.attention_percent);
    if (Math.abs(diff) >= 5) {
      findings.push(
        `Assessments outside the normal BMI range ${diff > 0 ? 'rose' : 'fell'} from ${stats.previous.attention_percent}% to ${stats.attention.percent}% compared with ${stats.previous.label}.`,
      );
    }

    if (stats.averages.bmi !== null && stats.previous.average_bmi !== null) {
      const bmiDiff = round1(stats.averages.bmi - stats.previous.average_bmi);
      if (Math.abs(bmiDiff) >= 0.3) {
        findings.push(
          `Average BMI ${bmiDiff > 0 ? 'rose' : 'fell'} by ${Math.abs(bmiDiff)} kg/m² compared with ${stats.previous.label} (${stats.previous.average_bmi} to ${stats.averages.bmi}).`,
        );
      }
    }
  }

  const suggestions: string[] = [];

  if (priority.obese_class_2_3 > 0) {
    suggestions.push(
      `Refer the ${priority.obese_class_2_3} ${plural(priority.obese_class_2_3, 'person', 'personnel')} in Obese Class 2 or 3 to the health service for evaluation before strenuous fitness activities.`,
    );
  }
  if (standing.above > 0) {
    suggestions.push(
      `Enrol the ${standing.above} ${plural(standing.above, 'person', 'personnel')} above the PNP acceptable BMI in a supervised weight-management and physical fitness program, and re-assess monthly.`,
    );
  }
  if (standing.underweight > 0) {
    suggestions.push(
      `Refer the ${standing.underweight} underweight ${plural(standing.underweight, 'person', 'personnel')} for nutrition counselling.`,
    );
  }
  if (p && p.worsened > 0) {
    suggestions.push(
      `Follow up with the ${p.worsened} ${plural(p.worsened, 'person', 'personnel')} whose classification worsened.`,
    );
  }
  if (dataQualityNotes(stats).length > 0) {
    suggestions.push('Correct the flagged records so the statistics reflect real measurements.');
  }
  if (suggestions.length === 0) {
    suggestions.push('All assessed personnel are within the PNP standard; continue routine monthly BMI monitoring.');
  }

  return { summary, findings, suggestions: suggestions.slice(0, 4) };
}

/* ------------------------------------------------------------ prompts */

export const DASHBOARD_SYSTEM_PROMPT =
  'You are a health-awareness assistant for a Philippine National Police (PNP) BMI monitoring system. ' +
  'You receive anonymous statistics about BMI assessments of police personnel, classified against the PNP acceptable BMI ' +
  '(which allows a slightly higher BMI as age increases). "standing" counts each person once, from their latest assessment. ' +
  'Write calm, plain English for the unit commander and health service staff. ' +
  'Never diagnose, never recommend medication or specific diets, and never invent numbers: use only numbers that appear in the data. ' +
  'If data_quality reports problems, say those records need to be checked before trusting the statistics. ' +
  'Reply with JSON only, exactly in this shape: ' +
  '{"summary": string (max 60 words), "findings": string[] (max 4 items), "suggestions": string[] (max 3 items)}.';

export const buildDashboardPrompt = (stats: DashboardStats): string =>
  `BMI statistics for ${stats.scope.label} (JSON):\n${JSON.stringify(stats)}`;

/* ------------------------------------------------- model output parsing */

/**
 * Small local models often wrap JSON in prose or code fences. Pull out the
 * first {...} block and parse it; anything that is not valid returns null so
 * the caller falls back to the rule-based text.
 */
export function extractJsonObject(text: string | null | undefined): Record<string, unknown> | null {
  if (!text) return null;

  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;

  try {
    const parsed = JSON.parse(text.slice(start, end + 1));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

const cleanString = (v: unknown, max: number): string | null => {
  if (typeof v !== 'string') return null;
  const s = v.replace(/\s+/g, ' ').trim();
  return s.length > 0 ? s.slice(0, max) : null;
};

const cleanList = (v: unknown, maxItems: number, maxLen: number): string[] =>
  Array.isArray(v)
    ? v
        .map((x) => cleanString(x, maxLen))
        .filter((x): x is string => x !== null)
        .slice(0, maxItems)
    : [];

export function parseDashboardModelOutput(text: string | null | undefined): DashboardInsights | null {
  const obj = extractJsonObject(text);
  if (!obj) return null;

  const summary = cleanString(obj.summary, 600);
  if (!summary) return null;

  return {
    summary,
    findings: cleanList(obj.findings, 4, 300),
    suggestions: cleanList(obj.suggestions, 3, 300),
  };
}
