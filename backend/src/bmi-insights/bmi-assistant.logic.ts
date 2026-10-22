// BMI Assistant: a chat that answers questions about BMI, the PNP BMI
// standards, and healthy weight. Pure functions only (no Nest, no DB), so
// the prompt and the rule-based fallback can be unit-tested.

import type { ChatMessage } from './local-llm.client';

export const MAX_QUESTION_CHARS = 500;
export const MAX_HISTORY_TURNS = 8;
const MAX_HISTORY_CHARS = 1500;

/** What the assistant knows about the person asking (personnel only). */
export type PersonContext = {
  name: string | null;
  rank: string | null;
  age: number | null;
  sex: string | null;
  assessmentCount: number;
  latest: {
    date: string | null;
    height: number;
    weight: number;
    bmi: number;
    ibw: number;
    weightToLose: number;
    pnp: string | null;
  } | null;
  previous: { date: string | null; weight: number; bmi: number } | null;
};

/**
 * What the assistant knows about the system as a whole (admin questions
 * not answered by answerRecordsQuestion's exact computations). Grounds the
 * model in real facts instead of letting it guess office/rank names or
 * dates for anything not yet covered by a specific rule.
 */
export type AdminContext = {
  totalPersonnel: number;
  offices: string[];
  ranks: string[];
  latestAssessmentDate: string | null;
};

// ---- PNP Acceptable BMI Classification (Jan 2020, DHRDD) ----
// Kept identical to BmiAssessmentsService.getPnpClassification.
export function pnpAcceptableUpper(age: number | null): number {
  if (age === null || age <= 29) return 24.9;
  if (age <= 34) return 25.0;
  if (age <= 39) return 25.5;
  if (age <= 44) return 26.0;
  if (age <= 50) return 26.5;
  return 27.0;
}

const PNP_TABLE = [
  'PNP BMI classification (Jan 2020):',
  '- below 17.0: Severely Underweight',
  '- 17.0 to 18.4: Underweight',
  '- 18.5 to 24.9: Normal',
  '- above 24.9 up to the age limit: Acceptable BMI (limit 24.9 at age 29 and below, 25.0 at 30-34, 25.5 at 35-39, 26.0 at 40-44, 26.5 at 45-50, 27.0 at 51+)',
  '- above that up to 29.9: Overweight',
  '- 30.0 to 34.9: Obese Class 1; 35.0 to 39.9: Obese Class 2; 40.0 and above: Obese Class 3',
  'BMI = weight (kg) / height (m)^2. Ideal body weight used by this system = 22 x height (m)^2.',
].join('\n');

const round1 = (n: number) => Math.round(n * 10) / 10;

export function describePerson(ctx: PersonContext): string {
  const who = [ctx.rank, ctx.name].filter(Boolean).join(' ') || 'the user';
  const lines = [
    `About ${who}: age ${ctx.age ?? 'unknown'}, sex ${ctx.sex ?? 'unknown'}, ${ctx.assessmentCount} assessment(s) on record.`,
  ];
  if (ctx.latest) {
    const l = ctx.latest;
    lines.push(
      `Latest assessment (${l.date ?? 'date unknown'}): height ${l.height} cm, weight ${l.weight} kg, BMI ${round1(l.bmi)}, PNP classification "${l.pnp ?? 'unknown'}", ideal body weight ${round1(l.ibw)} kg, weight above ideal ${round1(l.weightToLose)} kg.`,
      `Their acceptable BMI limit for their age is ${pnpAcceptableUpper(ctx.age)}.`,
    );
  } else {
    lines.push('They have no BMI assessment yet.');
  }
  if (ctx.previous && ctx.latest) {
    const d = round1(ctx.latest.weight - ctx.previous.weight);
    lines.push(
      `Previous assessment (${ctx.previous.date ?? 'date unknown'}): weight ${ctx.previous.weight} kg, BMI ${round1(ctx.previous.bmi)} (change since: ${d > 0 ? '+' : ''}${d} kg).`,
    );
  }
  return lines.join('\n');
}

export function describeSystem(ctx: AdminContext): string {
  return [
    `System data: ${ctx.totalPersonnel} personnel on record.`,
    `Real offices/departments on record: ${ctx.offices.length ? ctx.offices.join(', ') : 'none yet'}.`,
    `Real ranks on record: ${ctx.ranks.length ? ctx.ranks.join(', ') : 'none yet'}.`,
    `Most recent assessment on record: ${ctx.latestAssessmentDate ?? 'none yet'}.`,
    'Only ever use office, rank, or date names from this list for anything about the system\'s own data -- never invent one. If asked for a figure you do not have here (e.g. a specific count or cross-tab), say you do not have that exact figure rather than estimating or guessing.',
  ].join('\n');
}

export function systemPrompt(ctx: PersonContext | null, admin: AdminContext | null = null): string {
  return [
    'You are the BMI Assistant of the PNP ITMS BMI System (Philippine National Police).',
    'You answer questions about BMI, the PNP BMI standards, healthy weight, nutrition and exercise.',
    'Rules:',
    '- Health education only. Never diagnose, never name medicines or doses, never promise results.',
    '- For pain, illness, pregnancy, eating disorders, or very fast weight change, tell them to see the PNP Health Service or a doctor.',
    '- Use the numbers below exactly; do not invent measurements. If something is unknown, say so.',
    '- Safe pace: about 0.5 to 1 kg of weight change per week.',
    '- If the question is not about weight, BMI, fitness, nutrition or health, politely say you can only help with those.',
    '- Reply in the same language the user writes in (English or Filipino/Tagalog).',
    '- Be concise: at most about 150 words, short paragraphs or a few bullet points, plain text (no markdown headings).',
    '',
    PNP_TABLE,
    '',
    ctx
      ? describePerson(ctx)
      : admin
      ? `You are talking with a BMI System administrator, not an individual.\n${describeSystem(admin)}`
      : 'You are talking with a BMI System administrator. You have no individual personnel data; answer in general terms.',
  ].join('\n');
}

/** Cleans what the browser sent: trimmed, bounded, user/assistant only. */
export function sanitizeHistory(history: unknown): ChatMessage[] {
  if (!Array.isArray(history)) return [];
  return history
    .filter(
      (m): m is { role: 'user' | 'assistant'; content: string } =>
        !!m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim() !== '',
    )
    .slice(-MAX_HISTORY_TURNS)
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_HISTORY_CHARS) }));
}

// ---- Rule-based answers (no model configured, or it failed) ----

const has = (q: string, words: string[]) => words.some((w) => q.includes(w));

const ACTIVITY =
  'Aim for at least 150 minutes a week of moderate activity (brisk walking, jogging, cycling), plus muscle-strengthening exercise 2 days a week.';
const FOOD =
  'Eat more vegetables, fruit, fish, lean meat and whole grains; cut back on sugary drinks, fried food, white rice portions and late-night snacks; drink water instead of soft drinks.';
const SAFE_PACE = 'A safe pace is about 0.5 to 1 kg per week.';
const SEE_HEALTH =
  'For a personal plan or any health concern, talk to the PNP Health Service.';

const myResult = (l: PersonContext['latest']): string =>
  l
    ? `Your latest assessment (${l.date ?? 'latest'}): ${l.weight} kg at ${l.height} cm, BMI ${round1(l.bmi)}, PNP classification: ${l.pnp ?? 'not available'}. Your ideal body weight is about ${round1(l.ibw)} kg.`
    : 'You have no BMI assessment on record yet. Get measured at the kiosk or by the Health Service first.';

/**
 * Questions whose answer is a number or a standard (my BMI, how much to
 * lose or gain, ideal weight, the PNP classification, progress, the
 * formula). These are answered from the system's own calculations, never
 * by the model: a small local model was seen getting exactly these wrong
 * (ignoring the person's figures, inventing limits). null = not one of them.
 */
export function factualAnswer(question: string, ctx: PersonContext | null): string | null {
  const q = question.toLowerCase();
  const l = ctx?.latest ?? null;

  if (has(q, ['lose', 'losing', 'reduce', 'pumayat', 'bawas', 'magbawas', 'payat', 'diet', 'overweight', 'obese', 'taba'])) {
    const target =
      l && l.weightToLose > 0
        ? `${myResult(l)}\n\nYou are about ${round1(l.weightToLose)} kg above your ideal body weight of ${round1(l.ibw)} kg. ${SAFE_PACE} At 0.5 kg a week that is roughly ${Math.ceil(l.weightToLose / 0.5)} weeks.`
        : l
        ? `${myResult(l)}\n\nYou are at or below your ideal body weight (${round1(l.ibw)} kg), so you do not need to lose weight; focus on staying active.`
        : SAFE_PACE;
    return `${target}\n\n- ${FOOD}\n- ${ACTIVITY}\n- Eat about 500 kcal less per day than you burn; avoid crash diets.\n\n${SEE_HEALTH}`;
  }

  if (has(q, ['gain', 'underweight', 'tumaba', 'dagdag timbang', 'too thin'])) {
    return `${l ? myResult(l) + '\n\n' : ''}To gain weight healthily: eat regular meals with an extra healthy snack (rice with fish or eggs, peanuts, milk, bananas), add protein to every meal, and do strength training 2-3 times a week. ${SAFE_PACE}\n\n${SEE_HEALTH}`;
  }

  if (has(q, ['ideal', 'ibw', 'target weight', 'tamang timbang'])) {
    return l
      ? `Your ideal body weight is about ${round1(l.ibw)} kg (22 x your height of ${l.height} cm squared). You weigh ${l.weight} kg${l.weightToLose > 0 ? `, about ${round1(l.weightToLose)} kg above it` : ''}.`
      : 'This system uses ideal body weight = 22 x height (m) squared. For example, at 170 cm that is about 63.6 kg.';
  }

  if (has(q, ['classification', 'category', 'normal', 'range', 'standard', 'pnp', 'acceptable', 'klasipikasyon'])) {
    const mine = ctx ? `\n\nFor your age, BMI up to ${pnpAcceptableUpper(ctx.age)} is still "Acceptable".` : '';
    return PNP_TABLE.replace('PNP BMI classification (Jan 2020):', 'The PNP BMI classification (January 2020):') + mine;
  }

  if (has(q, ['formula', 'compute', 'calculate', 'how is bmi', 'paano kinukuha'])) {
    return `BMI = weight (kg) / height (m) squared.${l ? ` For you: ${l.weight} / (${round1(l.height / 100)} x ${round1(l.height / 100)}) = ${round1(l.bmi)}.` : ''} It is a quick screening number; it does not tell muscle from fat.`;
  }

  if (has(q, ['progress', 'trend', 'improve', 'compare', 'previous', 'last time'])) {
    if (ctx?.previous && l) {
      const d = round1(l.weight - ctx.previous.weight);
      return `Since ${ctx.previous.date ?? 'your previous assessment'} your weight changed by ${d > 0 ? '+' : ''}${d} kg (BMI ${round1(ctx.previous.bmi)} to ${round1(l.bmi)}).${d < 0 ? ' Good progress, keep it up.' : ''}`;
    }
    return 'You need at least two assessments to see progress.';
  }

  if (has(q, ['bmi', 'result', 'resulta', 'status', 'my weight', 'timbang ko'])) {
    return myResult(l);
  }

  return null;
}

/** Everything the assistant can say with no model at all. */
export function rulesAnswer(question: string, ctx: PersonContext | null): string {
  const factual = factualAnswer(question, ctx);
  if (factual) return factual;

  const q = question.toLowerCase();
  const l = ctx?.latest ?? null;

  if (has(q, ['exercise', 'workout', 'ehersisyo', 'run', 'jog', 'activity', 'gym'])) {
    return `${ACTIVITY} Start slowly if you are not used to it and build up over a few weeks. Warm up and stretch.\n\n${SEE_HEALTH}`;
  }

  if (has(q, ['food', 'eat', 'meal', 'kain', 'pagkain', 'nutrition', 'rice', 'kanin'])) {
    return `${FOOD} Use a smaller plate, fill half of it with vegetables, and keep rice to about one cup per meal.`;
  }

  return `I can help with BMI and healthy weight. Try asking:\n- What is my BMI result?\n- How much weight should I lose?\n- What is the PNP BMI classification?\n- What exercise or food is good for me?${l ? '' : '\n\n' + myResult(l)}`;
}
