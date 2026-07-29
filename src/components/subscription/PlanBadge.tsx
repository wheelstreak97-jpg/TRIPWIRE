import { useSubscription } from '../../hooks/useSubscription';
import './PlanBadge.css';

interface PlanBadgeProps {
  className?: string;
}

export function PlanBadge({ className = '' }: PlanBadgeProps) {
  const { planName, loading } = useSubscription();

  if (loading || !planName) return null;

  return (
    <span className={`plan-badge plan-badge--${planName.toLowerCase()} ${className}`}>
      {planName}
    </span>
  );
}