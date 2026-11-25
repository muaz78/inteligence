// Question Quality Control Validation for CountryRush RAQE
import type { QuestionMetadata, QuestionValidationResult, QuestionDifficulty, QuestionCategory } from '../../types/question';

const VALID_DIFFICULTIES: QuestionDifficulty[] = ['D1', 'D2', 'D3', 'D4', 'D5'];

const VALID_CATEGORIES: QuestionCategory[] = [
  'automotive',
  'aviation',
  'cities',
  'villages',
  'technology',
  'brands',
  'landmarks',
  'nature',
  'geography',
  'culture',
];

/**
 * Validates an individual question against competitive fairness and quality control standards.
 */
export function validateQuestion(q: Partial<QuestionMetadata>): QuestionValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const qId = q.id || 'unknown_id';

  // 1. Unique ID
  if (!q.id || typeof q.id !== 'string' || q.id.trim() === '') {
    errors.push('Question is missing a valid unique ID.');
  }

  // 2. Verification status (Strict Quality Gate)
  if (q.verified !== true) {
    errors.push('Question has not passed editorial verification.');
  }

  // 3. Category
  if (!q.category || !VALID_CATEGORIES.includes(q.category)) {
    errors.push(`Invalid or unverified category: "${q.category}".`);
  }

  // 4. Difficulty
  if (!q.difficulty || !VALID_DIFFICULTIES.includes(q.difficulty)) {
    errors.push(`Invalid difficulty level: "${q.difficulty}". Must be D1 to D5.`);
  }

  // 5. Question content / prompt
  if (!q.prompt || typeof q.prompt !== 'string' || q.prompt.trim().length < 5) {
    errors.push('Question prompt is empty or too brief.');
  }

  // 6. Correct Country
  if (!q.correctCountry || typeof q.correctCountry !== 'string' || q.correctCountry.trim() === '') {
    errors.push('Question lacks a specified correctCountry.');
  }

  // 7. Answer Options (Must be exactly 4 valid non-empty options)
  if (!Array.isArray(q.options) || q.options.length !== 4) {
    errors.push(`Question must contain exactly 4 answer options (found ${q.options ? q.options.length : 0}).`);
  } else {
    // Check for empty options
    const hasEmptyOption = q.options.some((opt) => !opt || typeof opt !== 'string' || opt.trim() === '');
    if (hasEmptyOption) {
      errors.push('One or more answer options are blank.');
    }

    // Check for duplicate options (Strict rule)
    const normalizedOptions = q.options.map((opt) => (opt ? opt.trim().toLowerCase() : ''));
    const uniqueOptions = new Set(normalizedOptions);
    if (uniqueOptions.size !== 4) {
      errors.push('Question contains duplicate answer options.');
    }

    // Options must include the correct country
    if (q.correctCountry && !normalizedOptions.includes(q.correctCountry.trim().toLowerCase())) {
      errors.push(`Options list does not contain the designated correctCountry ("${q.correctCountry}").`);
    }
  }

  // Quality warnings
  if (q.hints && q.hints.length === 0) {
    warnings.push('Question has hints array initialized but empty.');
  }

  return {
    isValid: errors.length === 0,
    questionId: qId,
    errors,
    warnings,
  };
}

/**
 * Validates a batch of questions and returns only eligible, verified items.
 */
export function filterVerifiedQuestions(pool: QuestionMetadata[]): {
  verifiedPool: QuestionMetadata[];
  rejectedCount: number;
  report: QuestionValidationResult[];
} {
  const verifiedPool: QuestionMetadata[] = [];
  const report: QuestionValidationResult[] = [];
  let rejectedCount = 0;

  for (const q of pool) {
    const res = validateQuestion(q);
    report.push(res);
    if (res.isValid) {
      verifiedPool.push(q);
    } else {
      rejectedCount++;
    }
  }

  return {
    verifiedPool,
    rejectedCount,
    report,
  };
}
