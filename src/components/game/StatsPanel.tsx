import React from 'react';
import { cn } from '@/lib/utils';
import { Trophy, Clock, Target, RotateCcw } from 'lucide-react';
import { formatTime } from '@/utils/gameLogic';

interface StatsPanelProps {
  score: number;
  time: number;
  accuracy: number;
  onReset?: () => void;
  className?: string;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  score,
  time,
  accuracy,
  onReset,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Score */}
      <div className="flex items-center gap-1.5 px-2 py-1 bg-secondary/50 rounded-lg border border-border">
        <Trophy className="w-3.5 h-3.5 text-warning" />
        <span className="text-sm font-bold text-warning">{score}</span>
      </div>

      {/* Time */}
      <div className="flex items-center gap-1.5 px-2 py-1 bg-secondary/50 rounded-lg border border-border">
        <Clock className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-sm font-bold font-mono">{formatTime(time)}</span>
      </div>

      {/* Accuracy */}
      <div className="flex items-center gap-1.5 px-2 py-1 bg-secondary/50 rounded-lg border border-border">
        <Target className="w-3.5 h-3.5 text-warning" />
        <span className={cn(
          'text-sm font-bold',
          accuracy >= 80 && 'text-success',
          accuracy >= 50 && accuracy < 80 && 'text-warning',
          accuracy < 50 && 'text-destructive'
        )}>
          {accuracy}%
        </span>
      </div>

      {/* Reset Button */}
      {onReset && (
        <button
          onClick={onReset}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm font-medium transition-all',
            'bg-secondary/50 border border-destructive/50 text-destructive hover:bg-destructive/10'
          )}
          title="Reset game"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

export default StatsPanel;