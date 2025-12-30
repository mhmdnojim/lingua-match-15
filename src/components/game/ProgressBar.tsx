import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProgressBarProps {
  currentBatch: number;
  totalBatches: number;
  completedBatches: number[];
  onSelectBatch: (batchIndex: number) => void;
  matched: number;
  total: number;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  currentBatch,
  totalBatches,
  completedBatches,
  onSelectBatch,
  matched,
  total,
  className,
}) => {
  const batchPercentage = totalBatches > 0 ? ((currentBatch + 1) / totalBatches) * 100 : 0;
  const matchedPercentage = total > 0 ? (matched / total) * 100 : 0;

  const handlePrev = () => {
    if (currentBatch > 0) {
      onSelectBatch(currentBatch - 1);
    }
  };

  const handleNext = () => {
    if (currentBatch < totalBatches - 1) {
      onSelectBatch(currentBatch + 1);
    }
  };

  const handleBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const batchIndex = Math.floor(percentage * totalBatches);
    const clampedIndex = Math.max(0, Math.min(batchIndex, totalBatches - 1));
    onSelectBatch(clampedIndex);
  };

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between text-sm text-muted-foreground mb-1">
        <span>Progress</span>
        <span>{matched} / {total} matched</span>
      </div>
      
      {/* Main progress bar with batch navigation */}
      <div className="relative h-3 bg-secondary rounded-full overflow-hidden cursor-pointer" onClick={handleBarClick}>
        {/* Batch segments background */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: totalBatches }, (_, index) => {
            const isCompleted = completedBatches.includes(index);
            const isCurrent = currentBatch === index;
            return (
              <div
                key={index}
                className={cn(
                  'flex-1 border-r border-background/30 last:border-r-0 transition-colors duration-300',
                  isCompleted && 'bg-success',
                  isCurrent && !isCompleted && 'bg-primary',
                  !isCurrent && !isCompleted && 'bg-secondary'
                )}
              />
            );
          })}
        </div>
        
        {/* Current batch progress overlay */}
        <div
          className="absolute h-full bg-accent/50 transition-all duration-300"
          style={{ 
            left: `${(currentBatch / totalBatches) * 100}%`,
            width: `${(1 / totalBatches) * matchedPercentage}%`
          }}
        />
      </div>

      {/* Navigation controls */}
      <div className="flex items-center justify-center gap-2 mt-2">
        <button
          onClick={handlePrev}
          disabled={currentBatch === 0}
          className={cn(
            'p-1 rounded-md transition-all',
            currentBatch === 0
              ? 'text-muted-foreground/30 cursor-not-allowed'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          )}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        {/* Batch indicators */}
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalBatches }, (_, index) => {
            const isCompleted = completedBatches.includes(index);
            const isCurrent = currentBatch === index;
            return (
              <button
                key={index}
                onClick={() => onSelectBatch(index)}
                className={cn(
                  'w-8 h-8 rounded-lg font-semibold text-xs transition-all duration-200',
                  'border hover:scale-105 active:scale-95',
                  isCurrent && 'bg-warning text-warning-foreground border-warning shadow-lg shadow-warning/30',
                  isCompleted && !isCurrent && 'bg-success/20 text-success border-success/50',
                  !isCurrent && !isCompleted && 'bg-secondary text-muted-foreground border-border hover:border-warning/50'
                )}
                aria-label={`Batch ${index + 1}${isCompleted ? ' (completed)' : ''}${isCurrent ? ' (current)' : ''}`}
              >
                {index + 1}
              </button>
            );
          })}
        </div>
        
        <button
          onClick={handleNext}
          disabled={currentBatch === totalBatches - 1}
          className={cn(
            'p-1 rounded-md transition-all',
            currentBatch === totalBatches - 1
              ? 'text-muted-foreground/30 cursor-not-allowed'
              : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
          )}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ProgressBar;
