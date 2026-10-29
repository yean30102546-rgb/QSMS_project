import { describe, expect, it } from 'vitest';
import {
  INITIAL_FEEDBACK_EVALUATIONS,
  computeFeedbackReportSummary,
} from '@/src/data/initialFeedbackEvaluation';

describe('Website Feedback Evaluation Dataset & Report Summary (15 Evaluators)', () => {
  it('contains exactly 15 evaluator submissions (U01–U15) covering all 6 roles and 5 modules', () => {
    expect(INITIAL_FEEDBACK_EVALUATIONS).toHaveLength(15);

    const evaluatorCodes = INITIAL_FEEDBACK_EVALUATIONS.map((item) => item.evaluatorCode);
    expect(evaluatorCodes).toEqual([
      'U01', 'U02', 'U03', 'U04', 'U05',
      'U06', 'U07', 'U08', 'U09', 'U10',
      'U11', 'U12', 'U13', 'U14', 'U15',
    ]);

    const roles = new Set(INITIAL_FEEDBACK_EVALUATIONS.map((item) => item.user_role));
    expect(roles).toEqual(new Set(['QSMS', 'PDF', 'WFG', 'WPK', 'CS', 'ADMIN']));

    const modules = new Set(INITIAL_FEEDBACK_EVALUATIONS.map((item) => item.module));
    expect(modules).toEqual(
      new Set([
        'overall',
        'rework_management',
        'drawing_master_ocr',
        'docai_assistant',
        'ui_performance',
      ])
    );
  });

  it('computes accurate mean, standard deviation, and per-module statistics across all 15 records', () => {
    const summary = computeFeedbackReportSummary(INITIAL_FEEDBACK_EVALUATIONS);

    expect(summary.totalResponses).toBe(15);
    expect(summary.overallMean).toBeCloseTo(4.6, 2);
    expect(summary.overallSd).toBeCloseTo(0.51, 2);
    expect(summary.overallPercent).toBeCloseTo(92.0, 1);

    expect(summary.byCategory).toEqual({
      rating: 10,
      feature_request: 3,
      general: 1,
      bug_report: 1,
    });

    expect(summary.byModule).toHaveLength(5);
    const overallMod = summary.byModule.find((m) => m.module === 'overall');
    expect(overallMod?.count).toBe(3);
    expect(overallMod?.mean).toBeCloseTo(4.67, 2);
    expect(overallMod?.sd).toBeCloseTo(0.58, 2);

    const mobileMod = summary.byModule.find((m) => m.module === 'ui_performance');
    expect(mobileMod?.count).toBe(3);
    expect(mobileMod?.mean).toBeCloseTo(4.33, 2);
    expect(mobileMod?.sd).toBeCloseTo(0.58, 2);
  });
});
