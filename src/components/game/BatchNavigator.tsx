import React from 'react';
import { cn } from '@/lib/utils';

interface BatchNavigatorProps {
  totalBatches: number;
  currentBatch: number;
  completedBatches: number[];
  onSelectBatch: (batchIndex: number) => void;
}

export const BatchNavigator: React.FC<BatchNavigatorProps> = ({
  totalBatches,
  currentBatch,
  completedBatches,
  onSelectBatch,
}) => {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {Array.from({ length: totalBatches }, (_, index) => {
        const isCompleted = completedBatches.includes(index);
        const isCurrent = currentBatch === index;

        return (
          <button
            key={index}
            onClick={() => onSelectBatch(index)}
            className={cn(
              'w-10 h-10 rounded-lg font-semibold text-sm transition-all duration-200',
              'border-2 hover:scale-105 active:scale-95',
              isCurrent && !isCompleted && 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30',
              isCompleted && 'bg-success text-success-foreground border-success',
              !isCurrent && !isCompleted && 'bg-secondary text-secondary-foreground border-border hover:border-primary/50'
            )}
            aria-label={`Batch ${index + 1}${isCompleted ? ' (completed)' : ''}${isCurrent ? ' (current)' : ''}`}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
};

export default BatchNavigator;
