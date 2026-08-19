import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';

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
  const [isDragging, setIsDragging] = useState(false);
  const [hoverBatch, setHoverBatch] = useState<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const matchedPercentage = total > 0 ? (matched / total) * 100 : 0;

  const getBatchFromPosition = useCallback((clientX: number): number => {
    if (!barRef.current) return currentBatch;
    const rect = barRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = x / rect.width;
    const batchIndex = Math.floor(percentage * totalBatches);
    return Math.max(0, Math.min(batchIndex, totalBatches - 1));
  }, [currentBatch, totalBatches]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const batchIndex = getBatchFromPosition(e.clientX);
    onSelectBatch(batchIndex);
  };

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const batchIndex = getBatchFromPosition(e.clientX);
    setHoverBatch(batchIndex);
    if (isDragging) {
      onSelectBatch(batchIndex);
    }
  }, [isDragging, getBatchFromPosition, onSelectBatch]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
    setHoverBatch(null);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    const touch = e.touches[0];
    const batchIndex = getBatchFromPosition(touch.clientX);
    onSelectBatch(batchIndex);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const batchIndex = getBatchFromPosition(touch.clientX);
    onSelectBatch(batchIndex);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const displayBatch = hoverBatch !== null ? hoverBatch : currentBatch;

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-end text-sm text-muted-foreground mb-1">
        <span>{matched} / {total} matched</span>
      </div>

      {/* Draggable progress bar */}
      <div
        ref={barRef}
        className={cn(
          'relative h-6 bg-secondary rounded-full overflow-hidden cursor-grab select-none',
          isDragging && 'cursor-grabbing'
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Batch segments */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: totalBatches }, (_, index) => {
            const isCompleted = completedBatches.includes(index);
            const isCurrent = currentBatch === index;
            const isHovered = hoverBatch === index;
            return (
              <div
                key={index}
                className={cn(
                  'flex-1 border-r border-background/30 last:border-r-0 transition-colors duration-200',
                  isCompleted && 'bg-success',
                  isCurrent && !isCompleted && 'bg-primary',
                  isHovered && !isCurrent && !isCompleted && 'bg-primary/50',
                  !isCurrent && !isCompleted && !isHovered && 'bg-secondary'
                )}
              />
            );
          })}
        </div>
        
        {/* Current batch progress overlay */}
        <div
          className="absolute h-full bg-accent/50 transition-all duration-200 pointer-events-none"
          style={{ 
            left: `${(currentBatch / totalBatches) * 100}%`,
            width: `${(1 / totalBatches) * matchedPercentage}%`
          }}
        />

        {/* Drag handle indicator */}
        <div
          className={cn(
            'absolute top-0 bottom-0 w-1 bg-warning rounded-full transition-all duration-200 pointer-events-none',
            isDragging && 'w-1.5 shadow-lg shadow-warning/50'
          )}
          style={{ 
            left: `${((currentBatch + 0.5) / totalBatches) * 100}%`,
            transform: 'translateX(-50%)'
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;