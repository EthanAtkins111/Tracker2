import { PriorityTier, RelationshipStrength } from "@/lib/types";
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
