'use client';

import { ShortlistOutcome, PaymentPricingType } from '@/types';

interface ShortlistOutcomeMessageProps {
  outcome?: ShortlistOutcome;
  pricingType?: PaymentPricingType;
  finalPrice?: number;
  className?: string;
}

const OUTCOME_MESSAGES: Record<ShortlistOutcome, string> = {
  fulfilled: 'Your shortlist has been delivered. Payment completed.',
  partial: 'We delivered a partial shortlist and adjusted pricing accordingly.',
  no_match: "We couldn't confidently recommend candidates for this role. You were not charged.",
};

const OUTCOME_STYLES: Record<ShortlistOutcome, { bg: string; border: string; icon: string }> = {
  fulfilled: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    icon: '✓',
  },
  partial: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    icon: '◐',
  },
  no_match: {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    icon: '—',
  },
};

function getOutcomeFromData(
  outcome?: ShortlistOutcome,
  pricingType?: PaymentPricingType,
  finalPrice?: number
): ShortlistOutcome {
  // If explicit outcome is provided, use it
  if (outcome) return outcome;

  // Infer from pricing type if available
  if (pricingType === 'full') return 'fulfilled';
  if (pricingType === 'partial') return 'partial';
  if (pricingType === 'free') return 'no_match';

  // Infer from final price
  if (finalPrice !== undefined) {
    if (finalPrice === 0) return 'no_match';
    return 'fulfilled';
  }

  // Default safe fallback
  return 'no_match';
}

export default function ShortlistOutcomeMessage({
  outcome,
  pricingType,
  finalPrice,
  className = '',
}: ShortlistOutcomeMessageProps) {
  const resolvedOutcome = getOutcomeFromData(outcome, pricingType, finalPrice);
  const message = OUTCOME_MESSAGES[resolvedOutcome];
  const styles = OUTCOME_STYLES[resolvedOutcome];

  return (
    <div
      className={`rounded-lg border p-4 ${styles.bg} ${styles.border} ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg leading-none">{styles.icon}</span>
        <p className="text-sm text-gray-700">{message}</p>
      </div>
    </div>
  );
}

export function getOutcomeMessage(outcome: ShortlistOutcome): string {
  return OUTCOME_MESSAGES[outcome];
}
