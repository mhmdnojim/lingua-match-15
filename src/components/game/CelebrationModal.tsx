import React, { useEffect } from 'react';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';
import { Trophy, Clock, Target, ArrowRight, RotateCcw } from 'lucide-react';
import { formatTime } from '@/utils/gameLogic';

interface CelebrationModalProps {
  isOpen: boolean;
  batchNumber: number;
  score: number;
  time: number;
  accuracy: number;
  isLastBatch: boolean;
  onNextBatch: () => void;
  onReplayBatch: () => void;
  onClose: () => void;
}

const encouragements = [
  "Excellent work! 太棒了！",
  "You're making great progress! 继续加油！",
  "Fantastic memory! 记忆力很好！",
  "Keep it up! 坚持就是胜利！",
  "Amazing performance! 表现出色！",
  "You're a natural! 很有天赋！",
];

export const CelebrationModal: React.FC<CelebrationModalProps> = ({
  isOpen,
  batchNumber,
  score,
  time,
  accuracy,
  isLastBatch,
  onNextBatch,
  onReplayBatch,
  onClose,
}) => {
  useEffect(() => {
    if (isOpen) {
      // Fire confetti
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.8 },
          colors: ['#8b5cf6', '#10b981', '#f59e0b'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.8 },
          colors: ['#8b5cf6', '#10b981', '#f59e0b'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className={cn(
        'relative z-10 w-full max-w-md bg-card rounded-2xl border border-border p-6 shadow-2xl',
        'animate-celebrate'
      )}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/20 mb-4">
            <Trophy className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-2xl font-bold mb-2">
            Batch {batchNumber} Complete! 🎉
          </h2>
          <p className="text-muted-foreground">
            {randomEncouragement}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="flex flex-col items-center p-3 bg-secondary rounded-lg">
            <Trophy className="w-5 h-5 text-warning mb-1" />
            <span className="text-2xl font-bold">{score}</span>
            <span className="text-xs text-muted-foreground">Points</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-secondary rounded-lg">
            <Clock className="w-5 h-5 text-accent mb-1" />
            <span className="text-2xl font-bold font-mono">{formatTime(time)}</span>
            <span className="text-xs text-muted-foreground">Time</span>
          </div>
          <div className="flex flex-col items-center p-3 bg-secondary rounded-lg">
            <Target className="w-5 h-5 text-primary mb-1" />
            <span className={cn(
              'text-2xl font-bold',
              accuracy >= 80 && 'text-success',
              accuracy >= 50 && accuracy < 80 && 'text-warning',
              accuracy < 50 && 'text-destructive'
            )}>
              {accuracy}%
            </span>
            <span className="text-xs text-muted-foreground">Accuracy</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onReplayBatch}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg',
              'bg-secondary hover:bg-secondary/80 text-foreground',
              'transition-colors duration-200 font-medium'
            )}
          >
            <RotateCcw className="w-4 h-4" />
            Replay
          </button>
          <button
            onClick={onNextBatch}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg',
              'bg-primary hover:bg-primary/90 text-primary-foreground',
              'transition-colors duration-200 font-medium'
            )}
          >
            {isLastBatch ? 'Finish' : 'Next Batch'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CelebrationModal;
