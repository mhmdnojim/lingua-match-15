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
    <div className={cn('flex items-center gap-4 md:gap-6', className)}>
      <div className="flex items-center gap-2">
        <Trophy className="w-5 h-5 text-warning" />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Score</span>
          <span className="font-bold text-lg">{score}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-accent" />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Time</span>
          <span className="font-bold text-lg font-mono">{formatTime(time)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" />
        <div className="flex flex-col">
          <span className="text-xs text-muted-foreground">Accuracy</span>
          <span className={cn(
            'font-bold text-lg',
            accuracy >= 80 && 'text-success',
            accuracy >= 50 && accuracy < 80 && 'text-warning',
            accuracy < 50 && 'text-destructive'
          )}>
            {accuracy}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
