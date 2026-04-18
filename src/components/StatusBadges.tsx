import { PriorityTier, RelationshipStrength, PipelineStage } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PriorityBadge({ tier }: { tier: PriorityTier }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
      tier === 'High' && 'priority-high',
      tier === 'Medium' && 'priority-medium',
      tier === 'Low' && 'priority-low',
    )}>
      {tier}
    </span>
  );
}

export function StrengthBadge({ strength }: { strength: RelationshipStrength }) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
      strength === 'Strong' && 'strength-strong',
      strength === 'Moderate' && 'strength-moderate',
      strength === 'Weak' && 'strength-weak',
      strength === 'New' && 'strength-new',
    )}>
      {strength}
    </span>
  );
}

export function PipelineBadge({ stage }: { stage: PipelineStage | undefined }) {
  if (!stage) return null;
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
      stage === 'Prospect'  && 'bg-muted text-muted-foreground',
      stage === 'Contacted' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      stage === 'Engaged'   && 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      stage === 'Demo'      && 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      stage === 'Active'    && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      stage === 'Lost'      && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    )}>
      {stage}
    </span>
  );
}

export function DaysSinceBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="text-xs text-muted-foreground">Never visited</span>;
  return (
    <span className={cn(
      "text-xs",
      days > 30 ? "text-destructive font-medium" : "text-muted-foreground"
    )}>
      {days === 0 ? 'Today' : `${days}d ago`}
    </span>
  );
}
