"use client";

import {
  ShortlistOutcome,
  ShortlistOutcomeString,
  PaymentPricingType,
} from "@/types";

interface ShortlistOutcomeMessageProps {
  outcome?: ShortlistOutcome | ShortlistOutcomeString | string;
  pricingType?: PaymentPricingType;
  finalPrice?: number;
  outcomeReason?: string;
  className?: string;
}

// Normalize outcome to string format
const normalizeOutcome = (
  outcome: string | undefined
): ShortlistOutcomeString | null => {
  if (!outcome) return null;
  const normalized = outcome.toLowerCase();
  if (normalized === "nomatch" || normalized === "no_match") return "noMatch";
  if (["pending", "delivered", "partial", "cancelled"].includes(normalized)) {
    return normalized as ShortlistOutcomeString;
  }
  return null;
};

const OUTCOME_MESSAGES: Record<ShortlistOutcomeString, string> = {
  pending: "Your shortlist is being prepared.",
  delivered: "Your shortlist has been delivered.",
  partial: "We delivered a partial shortlist and adjusted pricing accordingly.",
  noMatch:
    "After reviewing the role and available candidates, we're not confident we can deliver a shortlist that meets the quality bar.",
  cancelled: "This shortlist request has been cancelled.",
};

const OUTCOME_STYLES: Record<
  ShortlistOutcomeString,
  { bg: string; border: string; text: string; icon: string }
> = {
  pending: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    icon: "⏳",
  },
  delivered: {
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-800",
    icon: "✓",
  },
  partial: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    icon: "◐",
  },
  noMatch: {
    bg: "bg-gray-50",
    border: "border-gray-300",
    text: "text-gray-800",
    icon: "—",
  },
  cancelled: {
    bg: "bg-gray-50",
    border: "border-gray-200",
    text: "text-gray-600",
    icon: "✕",
  },
};

function getOutcomeFromData(
  outcome?: string,
  pricingType?: PaymentPricingType,
  finalPrice?: number
): ShortlistOutcomeString | null {
  // If explicit outcome is provided, use it
  const normalized = normalizeOutcome(outcome);
  if (normalized) return normalized;

  // Infer from pricing type if available
  if (pricingType === "full") return "delivered";
  if (pricingType === "partial") return "partial";
  if (pricingType === "free") return "noMatch";

  // Infer from final price
  if (finalPrice !== undefined) {
    if (finalPrice === 0) return "noMatch";
    return "delivered";
  }

  return null;
}

export default function ShortlistOutcomeMessage({
  outcome,
  pricingType,
  finalPrice,
  outcomeReason,
  className = "",
}: ShortlistOutcomeMessageProps) {
  const resolvedOutcome = getOutcomeFromData(outcome, pricingType, finalPrice);

  // Don't render if we have no outcome data
  if (!resolvedOutcome) {
    return null;
  }

  const message = OUTCOME_MESSAGES[resolvedOutcome];
  const styles = OUTCOME_STYLES[resolvedOutcome];

  return (
    <div
      className={`rounded-lg border p-5 ${styles.bg} ${styles.border} ${className}`}
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl leading-none">{styles.icon}</span>
        <div className="flex-1">
          <p className={`text-sm font-medium ${styles.text} mb-2`}>
            {resolvedOutcome === "noMatch"
              ? "No suitable candidates found"
              : message}
          </p>
          <p className="text-sm text-gray-700">{message}</p>
          {outcomeReason && (
            <p className="text-sm text-gray-600 mt-2 italic">{outcomeReason}</p>
          )}
          {resolvedOutcome === "noMatch" && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-sm font-semibold text-gray-900">
                You will not be charged for this request.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function getOutcomeMessage(outcome: string): string {
  const normalized = normalizeOutcome(outcome);
  return normalized ? OUTCOME_MESSAGES[normalized] : "";
}
