// Statistical Difficulty Calibration Architecture for CountryRush RAQE
import type { QuestionMetadata, QuestionDifficulty, CalibrationCandidate } from '../../types/question';

export interface CalibrationThresholds {
  minSampleSize: number; // Minimum attempts before a question is eligible for calibration review (e.g. 50 attempts)
  confidenceThreshold: number; // 0.0 - 1.0 confidence score requirement
  d1MaxAccuracy: number; // > 80%
  d2MinAccuracy: number; // 65% - 80%
  d3MinAccuracy: number; // 50% - 65%
  d4MinAccuracy: number; // 35% - 50%
  d5MinAccuracy: number; // < 35%
}

export const DEFAULT_CALIBRATION_THRESHOLDS: CalibrationThresholds = {
  minSampleSize: 40,
  confidenceThreshold: 0.75,
  d1MaxAccuracy: 0.82,
  d2MinAccuracy: 0.65,
  d3MinAccuracy: 0.50,
  d4MinAccuracy: 0.35,
  d5MinAccuracy: 0.20,
};

/**
 * Evaluates whether an empirical question's statistics indicate difficulty drift.
 * Note: Per competitive design principles, automatic live difficulty reassignments
 * are NOT applied in real-time matches; this module produces calibration candidates
 * for backend review and balancing oversight.
 */
export function evaluateCalibrationCandidate(
  q: QuestionMetadata,
  thresholds: CalibrationThresholds = DEFAULT_CALIBRATION_THRESHOLDS
): CalibrationCandidate | null {
  const { totalAttempts, correctRate, avgResponseTimeMs } = q.stats;

  // 1. Minimum sample size rule (Prevents knee-jerk adjustments on small samples)
  if (totalAttempts < thresholds.minSampleSize) {
    return null;
  }

  // 2. Compute confidence score based on sample size (approaches 1.0 as attempts grow beyond 100)
  const confidenceScore = Math.min(1.0, totalAttempts / 100);
  if (confidenceScore < thresholds.confidenceThreshold) {
    return null;
  }

  let suggestedDifficulty: QuestionDifficulty = q.difficulty;
  let reason = '';

  if (correctRate >= thresholds.d1MaxAccuracy && avgResponseTimeMs < 3000) {
    suggestedDifficulty = 'D1';
    reason = `Empirical accuracy is exceptionally high (${Math.round(correctRate * 100)}%) with sub-3s answer times.`;
  } else if (correctRate >= thresholds.d2MinAccuracy) {
    suggestedDifficulty = 'D2';
    reason = `Empirical accuracy is consistent with Normal difficulty (${Math.round(correctRate * 100)}%).`;
  } else if (correctRate >= thresholds.d3MinAccuracy) {
    suggestedDifficulty = 'D3';
    reason = `Empirical accuracy is consistent with Medium difficulty (${Math.round(correctRate * 100)}%).`;
  } else if (correctRate >= thresholds.d4MinAccuracy) {
    suggestedDifficulty = 'D4';
    reason = `Empirical accuracy is consistent with Hard difficulty (${Math.round(correctRate * 100)}%).`;
  } else {
    suggestedDifficulty = 'D5';
    reason = `Empirical accuracy is below 35% (${Math.round(correctRate * 100)}%) with prolonged deliberation times.`;
  }

  // If suggested matches current, no drift detected
  if (suggestedDifficulty === q.difficulty) {
    return null;
  }

  return {
    questionId: q.id,
    currentDifficulty: q.difficulty,
    suggestedDifficulty,
    sampleSize: totalAttempts,
    confidenceScore,
    reason,
  };
}

/**
 * Scans a pool of questions and generates calibration telemetry reports for development review.
 */
export function auditQuestionPoolCalibration(
  pool: QuestionMetadata[],
  thresholds: CalibrationThresholds = DEFAULT_CALIBRATION_THRESHOLDS
): CalibrationCandidate[] {
  const candidates: CalibrationCandidate[] = [];
  for (const q of pool) {
    const candidate = evaluateCalibrationCandidate(q, thresholds);
    if (candidate) {
      candidates.push(candidate);
    }
  }
  return candidates;
}
