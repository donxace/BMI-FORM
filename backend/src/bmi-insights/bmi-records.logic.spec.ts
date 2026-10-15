import { PersonRow, RecordRow, answerRecordsQuestion, normalizeClass, parseRange } from './bmi-records.logic';

const TODAY = '2026-10-15';

const people: PersonRow[] = [
  { personnelId: 1, rank: 'PAT', firstName: 'Carlo', surname: 'Reyes', sex: 'Male', age: 30, office: 'Quezon City Police District' },
  { personnelId: 2, rank: 'PLT', firstName: 'Ana', surname: 'Aquino', sex: 'Female', age: 41, office: 'PNP Health Service' },
  { personnelId: 3, rank: 'PCPT', firstName: 'Ben', surname: 'Aquino', sex: 'Male', age: 45, office: 'PNP Health Service' },
  { personnelId: 4, rank: 'PAT', firstName: 'Lea', surname: 'Santos', sex: 'Female', age: 28, office: 'Quezon City Police District' },
];

const rec = (personnelId: number, date: string, weight: number, bmi: number, pnp: string, height = 170): RecordRow =>
  ({ personnelId, date, height, weight, bmi, pnp });

const records: RecordRow[] = [
  rec(1, '2026-09-10', 90, 31.1, 'Obese Class I'),
  rec(1, '2026-10-02', 86, 29.8, 'Overweight'),
  rec(2, '2026-09-20', 70, 26.0, 'Acceptable BMI'),
  rec(2, '2026-10-05', 74, 27.5, 'Obese'),   // legacy label
  rec(3, '2026-10-06', 101, 34.9, 'Obese Class 1'),
  rec(3, '2026-10-06', 99, 34.3, 'Obese Class 1'), // same day, saved later: wins
  // person 4 never assessed
];

const ask = (q: string) => answerRecordsQuestion(q, people, records, TODAY)!;

describe('normalizeClass', () => {
  it('merges the legacy and roman-numeral spellings', () => {
    expect(normalizeClass('Obese Class I')).toBe('Obese Class 1');
    expect(normalizeClass('obese class iii')).toBe('Obese Class 3');
    expect(normalizeClass('Obese')).toBe('Obese');
  });
});

describe('parseRange', () => {
  it('reads relative and named periods (English and Filipino)', () => {
    expect(parseRange('this month', TODAY)).toMatchObject({ from: '2026-10-01', to: '2026-11-01' });
    expect(parseRange('last month', TODAY)).toMatchObject({ from: '2026-09-01', to: '2026-10-01' });
    expect(parseRange('in oktubre', TODAY)).toMatchObject({ label: 'October 2026' });
    expect(parseRange('september 2025', TODAY)).toMatchObject({ from: '2025-09-01' });
    expect(parseRange('how many may assessment', TODAY)).toBeNull(); // "may" = "there is", not May
  });
});

describe('answerRecordsQuestion', () => {
  it('counts people by their latest classification, all obese labels together', () => {
    expect(ask('How many personnel are obese?')).toContain('2 of 3 assessed personnel are Obese (all classes)');
  });

  it('counts assessments in a period', () => {
    expect(ask('How many assessments last month?')).toContain('2 assessment(s) in September 2026');
  });

  it('separates female from male (female contains "male")', () => {
    expect(ask('how many female personnel')).toContain('2 personnel are registered (female)');
    expect(ask('how many male personnel')).toContain('2 personnel are registered (male)');
  });

  it('averages each person latest value', () => {
    // latest BMIs: 29.8, 27.5, 34.3 -> 30.5
    expect(ask('What is the average BMI?')).toContain('Average BMI is 30.5 across 3 personnel');
  });

  it('ranks the highest BMI using the later same-day record', () => {
    const a = ask('Who has the highest BMI?');
    expect(a).toContain('PCPT Ben Aquino: 34.3');
  });

  it('lists personnel in a class, filtered by office acronym', () => {
    const a = ask('List the obese personnel in PNP Health Service');
    expect(a).toContain('2 personnel are Obese (all classes)');
    expect(a).not.toContain('Reyes');
  });

  it('finds who has not been assessed', () => {
    expect(ask('Who has not been assessed?')).toContain('PAT Lea Santos');
  });

  it('ranks weight loss between the last two assessments', () => {
    expect(ask('Who lost the most weight?')).toContain('PAT Carlo Reyes: -4 kg');
  });

  it('shows one person, and asks to choose on a shared surname', () => {
    expect(ask('Show the records of Reyes')).toContain('Latest (2026-10-02): BMI 29.8, Overweight');
    expect(ask("What is Aquino's latest BMI?")).toContain('More than one personnel matches');
    expect(ask('Show records of Ana Aquino')).toContain('PLT Ana Aquino');
  });

  it('summarises a period', () => {
    const a = ask('Give me a summary for this month');
    expect(a).toContain('Summary for October 2026: 4 assessment(s) of 3 personnel');
  });

  it('leaves non-records questions alone', () => {
    expect(answerRecordsQuestion('Is rice bad for me?', people, records, TODAY)).toBeNull();
    expect(answerRecordsQuestion('What is the PNP BMI classification?', people, records, TODAY)).toBeNull();
  });
});
