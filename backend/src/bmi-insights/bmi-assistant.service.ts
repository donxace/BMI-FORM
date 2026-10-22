import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BmiAssessment } from '../bmi-assessments/entities/bmi-assessment.entity';
import { Personnel } from '../personnel/personnel.entity';
import { LocalLlmClient } from './local-llm.client';
import { PersonRow, RecordRow, answerRecordsQuestion } from './bmi-records.logic';
import {
  AdminContext,
  MAX_QUESTION_CHARS,
  PersonContext,
  describePerson,
  factualAnswer,
  rulesAnswer,
  sanitizeHistory,
  systemPrompt,
} from './bmi-assistant.logic';

export type AssistantAnswer = {
  answer: string;
  /**
   * 'local-model' = written by the local AI model; 'rules' = built-in
   * guidance and the person's own figures; 'records' = computed from the
   * BMI System's records (staff only).
   */
  source: 'local-model' | 'rules' | 'records';
  model: string | null;
};

@Injectable()
export class BmiAssistantService {
  constructor(
    @InjectRepository(BmiAssessment)
    private readonly assessments: Repository<BmiAssessment>,
    @InjectRepository(Personnel)
    private readonly personnel: Repository<Personnel>,
    private readonly llm: LocalLlmClient,
  ) {}

  /**
   * Answers one question. `personnelId` set = a personnel asking about
   * themselves (their own latest assessments are given to the model);
   * null = an administrator asking in general.
   */
  async ask(
    question: unknown,
    history: unknown,
    personnelId: number | null,
  ): Promise<AssistantAnswer> {
    if (typeof question !== 'string' || question.trim() === '') {
      throw new BadRequestException('Please type a question.');
    }
    const q = question.trim();
    if (q.length > MAX_QUESTION_CHARS) {
      throw new BadRequestException(`Questions can be at most ${MAX_QUESTION_CHARS} characters.`);
    }

    const ctx = personnelId !== null ? await this.personContext(personnelId) : null;

    // Staff only: questions about the records themselves (counts, lists,
    // averages, one person's history) are computed from the database.
    // Personnel never reach this - they only ever see their own data.
    if (personnelId === null) {
      const records = await this.answerFromRecords(q);
      if (records) {
        return { answer: records, source: 'records', model: null };
      }
    }

    // Numbers and standards come from the system's own calculations, so
    // they are always right (and instant), whatever model is configured.
    const factual = factualAnswer(q, ctx);
    if (factual) {
      return { answer: factual, source: 'rules', model: null };
    }

    // Open-ended questions go to the model. The verified figures sit right
    // next to the question, where a small model actually uses them.
    const grounded = ctx
      ? `${q}\n\n(Verified data from the BMI System; use these figures, do not ask for them:\n${describePerson(ctx)})`
      : q;

    // Admin, nothing specific matched above: ground the model in the real
    // offices/ranks/latest date on file, so a question this service has no
    // bespoke answer for (e.g. a cross-tab) gets real names instead of
    // invented ones.
    const admin = ctx === null ? await this.systemContext() : null;

    const text = await this.llm.chat([
      { role: 'system', content: systemPrompt(ctx, admin) },
      ...sanitizeHistory(history),
      { role: 'user', content: grounded },
    ]);

    if (text && text.trim()) {
      return { answer: text.trim(), source: 'local-model', model: this.llm.model };
    }
    return { answer: rulesAnswer(q, ctx), source: 'rules', model: null };
  }

  private async answerFromRecords(question: string): Promise<string | null> {
    const [assessmentRows, personnelRows] = await Promise.all([
      this.assessments.find({
        select: { personnel_id: true, assessment_date: true, height: true, weight: true, bmi: true, pnp_classification: true },
        order: { assessment_id: 'ASC' },
      }),
      this.personnel.find(),
    ]);

    const records: RecordRow[] = assessmentRows
      .filter((a) => a.assessment_date)
      .map((a) => ({
        personnelId: Number(a.personnel_id),
        date: String(a.assessment_date).slice(0, 10),
        height: Number(a.height) || 0,
        weight: Number(a.weight) || 0,
        bmi: Number(a.bmi) || 0,
        pnp: a.pnp_classification ?? null,
      }));

    const people: PersonRow[] = personnelRows.map((p) => ({
      personnelId: Number(p.personnel_id),
      rank: p.rank ?? null,
      firstName: p.first_name ?? '',
      surname: p.surname ?? '',
      sex: p.sex ?? null,
      age: p.age ?? null,
      office: p.office ?? null,
    }));

    // Local calendar day, so "today" / "this month" match the clinic's clock.
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    return answerRecordsQuestion(question, people, records, today);
  }

  private async systemContext(): Promise<AdminContext> {
    const [personnelRows, [latest]] = await Promise.all([
      this.personnel.find({ select: { office: true, rank: true } }),
      this.assessments.find({
        select: { assessment_date: true },
        order: { assessment_date: 'DESC' },
        take: 1,
      }),
    ]);

    return {
      totalPersonnel: personnelRows.length,
      offices: [...new Set(personnelRows.map((p) => p.office).filter((o): o is string => !!o))].sort(),
      ranks: [...new Set(personnelRows.map((p) => p.rank).filter((r): r is string => !!r))].sort(),
      latestAssessmentDate: latest?.assessment_date ? String(latest.assessment_date).slice(0, 10) : null,
    };
  }

  // Only this personnel's own two most recent assessments.
  private async personContext(personnelId: number): Promise<PersonContext> {
    const rows = await this.assessments.find({
      where: { personnel_id: personnelId },
      relations: { personnel: true },
      order: { assessment_id: 'DESC' },
      take: 2,
    });
    const count = await this.assessments.count({ where: { personnel_id: personnelId } });
    const [latest, previous] = rows;
    const p: any = latest?.personnel ?? null;
    const num = (v: unknown) => Number(v) || 0;

    return {
      name: p ? `${p.first_name} ${p.surname}`.trim() : null,
      rank: p?.rank ?? null,
      age: p?.age ?? null,
      sex: p?.sex ?? null,
      assessmentCount: count,
      latest: latest
        ? {
            date: latest.assessment_date ? String(latest.assessment_date).slice(0, 10) : null,
            height: num(latest.height),
            weight: num(latest.weight),
            bmi: num(latest.bmi),
            ibw: num(latest.ibw),
            weightToLose: num(latest.weight_to_lose),
            pnp: latest.pnp_classification ?? null,
          }
        : null,
      previous: previous
        ? {
            date: previous.assessment_date ? String(previous.assessment_date).slice(0, 10) : null,
            weight: num(previous.weight),
            bmi: num(previous.bmi),
          }
        : null,
    };
  }
}
