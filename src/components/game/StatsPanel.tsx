import React from 'react';
import { cn } from '@/lib/utils';
import { Trophy, Clock, Target } from 'lucide-react';
import { formatTime } from '@/utils/gameLogic';

interface StatsPanelProps {
  score: number;
  time: number;
  accuracy: number;
  className?: string;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  score,
  time,
  accuracy,
  className,
}) => {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      {/* Score */}
      <div className="flex flex-col items-center px-4 py-2 bg-secondary/50 rounded-lg border border-border min-w-[80px]">
        <Trophy className="w-4 h-4 text-warning mb-1" />
        <span className="text-xl font-bold text-warning">{score}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</span>
      </div>

      {/* Time */}
      <div className="flex flex-col items-center px-4 py-2 bg-secondary/50 rounded-lg border border-border min-w-[80px]">
        <Clock className="w-4 h-4 text-muted-foreground mb-1" />
        <span className="text-xl font-bold font-mono">{formatTime(time)}</span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Time</span>
      </div>

      {/* Accuracy */}
      <div className="flex flex-col items-center px-4 py-2 bg-secondary/50 rounded-lg border border-border min-w-[80px]">
        <Target className="w-4 h-4 text-warning mb-1" />
        <span className={cn(
          'text-xl font-bold',
          accuracy >= 80 && 'text-warning',
          accuracy >= 50 && accuracy < 80 && 'text-warning',
          accuracy < 50 && 'text-destructive'
        )}>
          {accuracy}%
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Accuracy</span>
      </div>
    </div>
  );
};

export default StatsPanel;
