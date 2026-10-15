import {
  InsightRow,
  buildDashboardStats,
  dataQualityNotes,
  parseDashboardModelOutput,
  periodLabel,
  pnpLabel,
  pnpStanding,
  previousWindow,
  rulesDashboardInsights,
  whoCategory,
} from './bmi-insights.logic';
import { resolveScope } from './bmi-insights.controller';

let nextId = 1;

const row = (overrides: Partial<InsightRow> = {}): InsightRow => ({
  assessment_id: nextId++,
  personnel_id: 1,
  height: 170,
  weight: 65,
  waist: 80,
  bmi: 22.49,
  weight_to_lose: 1.42,
  pnp_classification: 'Normal',
  who_classification: 'Normal',
  assessment_date: '2026-09-10',
  office: 'Admin',
  age: 30,
  ...overrides,
});

const SEPT = { from: '2026-09-01', to: '2026-10-01' };
const ALL = { from: null, to: null };

describe('scope helpers', () => {
  it('labels a calendar month and all records', () => {
    expect(periodLabel(SEPT)).toBe('September 2026');
    expect(periodLabel(ALL)).toBe('all records');
  });

  it('compares a month with the month before, across a year boundary', () => {
    expect(previousWindow(SEPT, '2026-10-14')).toEqual({
      from: '2026-08-01',
      to: '2026-09-01',
      label: 'August 2026',
    });
    expect(previousWindow({ from: '2026-01-01', to: '2026-02-01' }, '2026-10-14')?.from).toBe(
      '2025-12-01',
    );
    expect(previousWindow(ALL, '2026-10-14')).toBeNull();
  });

  it('rejects impossible dates and reversed ranges', () => {
    expect(() => resolveScope({ from: '2026-02-31' })).toThrow();
    expect(() => resolveScope({ from: '2026-10-01', to: '2026-09-01' })).toThrow();
    expect(resolveScope({})).toEqual(ALL);
  });
});

describe('whoCategory', () => {
  it('uses the stored label, or the BMI when it is missing', () => {
    expect(whoCategory(row({ who_classification: 'Obese' }))).toBe('Obese');
    expect(whoCategory(row({ who_classification: null, bmi: 27 }))).toBe('Overweight');
    expect(whoCategory(row({ who_classification: null, bmi: null }))).toBeNull();
  });
});

describe('pnpLabel', () => {
  it('reads current labels and the legacy ones on older records', () => {
    expect(pnpLabel('acceptable bmi')).toBe('Acceptable BMI');
    expect(pnpLabel('Obese Class I')).toBe('Obese Class 1');
    expect(pnpLabel('Obese Class III')).toBe('Obese Class 3');
    expect(pnpStanding(pnpLabel('Obese'))).toBe('above');
    expect(pnpLabel('N/A')).toBeNull();
  });
});

describe('buildDashboardStats', () => {
  it('counts each person once, from their latest assessment', () => {
    const rows = [
      row({ personnel_id: 1, assessment_date: '2026-09-02', pnp_classification: 'Overweight', weight_to_lose: 9 }),
      row({ personnel_id: 1, assessment_date: '2026-09-20', pnp_classification: 'Acceptable BMI' }),
      row({ personnel_id: 2, pnp_classification: 'Obese Class 2', weight_to_lose: 20, bmi: 36, weight: 104, who_classification: 'Obese' }),
      row({ personnel_id: 3, pnp_classification: 'Underweight', bmi: 18, weight: 52, who_classification: 'Underweight' }),
    ];

    const stats = buildDashboardStats(rows, null, [], SEPT);

    expect(stats.total).toBe(4);
    expect(stats.personnel).toBe(3);
    expect(stats.standing).toEqual({ within: 1, above: 1, underweight: 1, unknown: 0 });
    expect(stats.priority.obese_class_2_3).toBe(1);
    // Only the person still above the standard counts toward weight to lose.
    expect(stats.weight_to_lose).toEqual({ personnel: 1, average: 20, total: 20 });
  });

  it('tells who improved against their last assessment before the month', () => {
    const baseline = [
      row({ personnel_id: 1, assessment_date: '2026-08-05', pnp_classification: 'Obese Class 1', weight: 90 }),
      row({ personnel_id: 2, assessment_date: '2026-08-05', pnp_classification: 'Normal', weight: 60 }),
    ];
    const rows = [
      row({ personnel_id: 1, pnp_classification: 'Overweight', weight: 85 }),
      row({ personnel_id: 2, pnp_classification: 'Overweight', weight: 64 }),
      row({ personnel_id: 3 }),
    ];

    const stats = buildDashboardStats(rows, null, baseline, SEPT);

    expect(stats.progress).toEqual({
      basis: 'previous',
      reassessed: 2,
      improved: 1,
      worsened: 1,
      unchanged: 0,
      average_weight_change: -0.5,
    });
  });

  it('flags implausible readings, leaves them out of averages, and flags a BMI mismatch', () => {
    const rows = [
      row({ bmi: 22, weight: 63.6 }),
      row({ personnel_id: 2, height: 17, bmi: 2249 }),
      row({ personnel_id: 3, weight: 80, bmi: 22 }),
    ];

    const stats = buildDashboardStats(rows, null, [], SEPT);

    expect(stats.data_quality.out_of_range.count).toBe(1);
    expect(stats.data_quality.bmi_mismatch.count).toBe(1);
    expect(stats.averages.bmi).toBe(22);
    expect(dataQualityNotes(stats).length).toBeGreaterThan(0);
  });

  it('ranks offices by share above the standard, ignoring tiny offices', () => {
    const rows = [
      ...[1, 2, 3].map((id) =>
        row({ personnel_id: id, office: 'Logistics', pnp_classification: id === 1 ? 'Normal' : 'Overweight' }),
      ),
      ...[4, 5, 6, 7].map((id) =>
        row({ personnel_id: id, office: 'Admin', pnp_classification: id === 4 ? 'Overweight' : 'Normal' }),
      ),
      row({ personnel_id: 8, office: 'Tiny', pnp_classification: 'Obese Class 1' }),
    ];

    const stats = buildDashboardStats(rows, null, [], SEPT);

    expect(stats.offices.map((o) => o.office)).toEqual(['Logistics', 'Admin']);
    expect(stats.offices[0]).toMatchObject({ above: 2, personnel: 3, percent: 66.7 });
  });
});

describe('rulesDashboardInsights', () => {
  it('handles an empty period', () => {
    const insights = rulesDashboardInsights(buildDashboardStats([], null, [], SEPT));
    expect(insights.summary).toBe('No BMI assessments were recorded in September 2026.');
  });

  it('summarises PNP standing and suggests follow-up', () => {
    const stats = buildDashboardStats(
      [
        row({ personnel_id: 1 }),
        row({ personnel_id: 2, pnp_classification: 'Obese Class 3', weight_to_lose: 30, bmi: 41, weight: 118.5, who_classification: 'Obese' }),
      ],
      null,
      [],
      SEPT,
    );
    const insights = rulesDashboardInsights(stats);

    expect(insights.summary).toContain('Of 2 personnel assessed in September 2026, 1 (50%) is within');
    expect(insights.findings[0]).toBe('Highest-priority cases: 1 in Obese Class 2 or 3.');
    expect(insights.suggestions[0]).toContain('Obese Class 2 or 3 to the health service');
  });
});

describe('parseDashboardModelOutput', () => {
  it('pulls JSON out of fenced prose and rejects junk', () => {
    expect(
      parseDashboardModelOutput('Sure!\n```json\n{"summary":"Fine.","findings":["a"],"suggestions":[1,"b"]}\n```'),
    ).toEqual({ summary: 'Fine.', findings: ['a'], suggestions: ['b'] });
    expect(parseDashboardModelOutput('no json here')).toBeNull();
    expect(parseDashboardModelOutput('{"findings":[]}')).toBeNull();
  });
});
