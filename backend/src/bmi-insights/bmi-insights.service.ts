import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { BmiAssessment } from '../bmi-assessments/entities/bmi-assessment.entity';
import { LocalLlmClient } from './local-llm.client';
import {
  DASHBOARD_SYSTEM_PROMPT,
  DashboardStats,
  InsightRow,
  InsightScope,
  ScopeInfo,
  buildDashboardPrompt,
  buildDashboardStats,
  dataQualityNotes,
  parseDashboardModelOutput,
  previousWindow,
  rulesDashboardInsights,
} from './bmi-insights.logic';

export type InsightSource = 'local-model' | 'rules';

export type DashboardInsightsResponse = {
  source: InsightSource;
  model: string | null;
  note: string | null;
  generated_at: string;
  scope: ScopeInfo;
  stats: DashboardStats;
  summary: string;
  findings: string[];
  suggestions: string[];
  data_quality: string[];
};

const DASHBOARD_TTL_MS = 10 * 60 * 1000;
const MAX_CACHED_DASHBOARDS = 50;

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

@Injectable()
export class BmiInsightsService {
  private readonly dashboardCache = new Map<
    string,
    { at: number; value: DashboardInsightsResponse }
  >();
  private readonly inflight = new Map<string, Promise<unknown>>();

  constructor(
    @InjectRepository(BmiAssessment)
    private readonly repository: Repository<BmiAssessment>,
    private readonly llm: LocalLlmClient,
  ) {}

  getStatus() {
    return {
      model_enabled: this.llm.enabled,
      model: this.llm.enabled ? this.llm.model : null,
    };
  }

  /**
   * Insights for exactly what the dashboard is showing (a month, or all
   * records). The trend compares with the window right before it.
   */
  async getDashboardInsights(
    scope: InsightScope,
    refresh = false,
  ): Promise<DashboardInsightsResponse> {
    const key = JSON.stringify([scope.from, scope.to]);

    const cached = this.dashboardCache.get(key);
    if (!refresh && cached && Date.now() - cached.at < DASHBOARD_TTL_MS) {
      return cached.value;
    }

    // One model call at a time per scope, however many admins ask.
    return this.once(`dashboard:${key}`, async () => {
      const value = await this.buildDashboardInsights(scope);

      this.dashboardCache.set(key, { at: Date.now(), value });

      if (this.dashboardCache.size > MAX_CACHED_DASHBOARDS) {
        const oldest = this.dashboardCache.keys().next().value;
        if (oldest !== undefined) this.dashboardCache.delete(oldest);
      }

      return value;
    });
  }

  private async buildDashboardInsights(
    scope: InsightScope,
  ): Promise<DashboardInsightsResponse> {
    const now = new Date();
    const previous = previousWindow(scope, isoDate(now));

    const [rows, previousRows] = await Promise.all([
      this.fetchRows(scope.from, scope.to),
      previous
        ? this.fetchRows(previous.from, previous.to)
        : Promise.resolve([] as InsightRow[]),
    ]);

    // Earlier assessments of the same personnel, to tell who improved.
    const baseline = scope.from
      ? await this.fetchRows(
          null,
          scope.from,
          [...new Set(rows.map((r) => String(r.personnel_id)))],
        )
      : [];

    const stats = buildDashboardStats(
      rows,
      previous ? { rows: previousRows, label: previous.label } : null,
      baseline,
      scope,
    );
    const rules = rulesDashboardInsights(stats);
    const dataQuality = dataQualityNotes(stats);

    let source: InsightSource = 'rules';
    let insights = rules;
    let note: string | null = null;

    if (this.llm.enabled && stats.total > 0) {
      const text = await this.llm.complete(
        DASHBOARD_SYSTEM_PROMPT,
        buildDashboardPrompt(stats),
      );
      const parsed = parseDashboardModelOutput(text);

      if (parsed) {
        source = 'local-model';
        insights = parsed;
      } else {
        note =
          'The local AI model did not give a usable answer, so this is the rule-based summary.';
      }
    }

    return {
      source,
      model: source === 'local-model' ? this.llm.model : null,
      note,
      generated_at: now.toISOString(),
      scope: stats.scope,
      stats,
      summary: insights.summary,
      findings: insights.findings,
      suggestions: insights.suggestions,
      // Always the deterministic notes: a model must not be able to hide a data problem.
      data_quality: dataQuality,
    };
  }

  /* -------------------------------------------------------------- helpers */

  private async fetchRows(
    from: string | null,
    toExclusive: string | null,
    personnelIds?: string[],
  ): Promise<InsightRow[]> {
    if (personnelIds && personnelIds.length === 0) return [];

    const query = this.repository
      .createQueryBuilder('a')
      .leftJoin('personnel', 'p', 'p.personnel_id = a.personnel_id')
      .select('a.assessment_id', 'assessment_id')
      .addSelect('a.personnel_id', 'personnel_id')
      .addSelect('a.height', 'height')
      .addSelect('a.weight', 'weight')
      .addSelect('a.waist', 'waist')
      .addSelect('a.bmi', 'bmi')
      .addSelect('a.weight_to_lose', 'weight_to_lose')
      .addSelect('a.pnp_classification', 'pnp_classification')
      .addSelect('a.who_classification', 'who_classification')
      // As text, so the server's time zone cannot shift the day.
      .addSelect("DATE_FORMAT(a.assessment_date, '%Y-%m-%d')", 'assessment_date')
      .addSelect('p.office', 'office')
      .addSelect('p.age', 'age');

    if (from) query.andWhere('a.assessment_date >= :from', { from });
    if (toExclusive) query.andWhere('a.assessment_date < :to', { to: toExclusive });
    if (personnelIds) query.andWhere('a.personnel_id IN (:...ids)', { ids: personnelIds });

    return query.getRawMany<InsightRow>();
  }

  private once<T>(key: string, work: () => Promise<T>): Promise<T> {
    const running = this.inflight.get(key) as Promise<T> | undefined;
    if (running) return running;

    const promise = work().finally(() => this.inflight.delete(key));
    this.inflight.set(key, promise);
    return promise;
  }
}
