import React from 'react';
import { cn } from '@/lib/utils';
import { GameMode } from '@/utils/gameLogic';
import { Columns2, Columns3, Eye, EyeOff, RotateCcw } from 'lucide-react';

interface GameSettingsProps {
  mode: GameMode;
  showPinyin: boolean;
  onModeChange: (mode: GameMode) => void;
  onShowPinyinChange: (show: boolean) => void;
  onReset?: () => void;
  disabled?: boolean;
  className?: string;
}

export const GameSettings: React.FC<GameSettingsProps> = ({
  mode,
  showPinyin,
  onModeChange,
  onShowPinyinChange,
  onReset,
  disabled = false,
  className,
}) => {
  return (
    <div className={cn('flex flex-wrap items-center justify-center gap-2', className)}>
      {/* Column Mode Toggle */}
      <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
        <button
          onClick={() => onModeChange('2-column')}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            mode === '2-column' 
              ? 'bg-card text-foreground border border-border' 
              : 'text-muted-foreground hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Columns2 className="w-4 h-4" />
          <span>2 Columns</span>
        </button>
        <button
          onClick={() => onModeChange('3-column')}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            mode === '3-column' 
              ? 'bg-card text-foreground border border-border' 
              : 'text-muted-foreground hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Columns3 className="w-4 h-4" />
          <span>3 Columns</span>
        </button>
      </div>

      {/* Pinyin Toggle (only in 2-column mode) */}
      {mode === '2-column' && (
        <button
          onClick={() => onShowPinyinChange(!showPinyin)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            'border border-border bg-secondary',
            showPinyin 
              ? 'text-foreground' 
              : 'text-muted-foreground'
          )}
        >
          {showPinyin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          <span>Pinyin</span>
        </button>
      )}

      {/* Reset Button */}
      {onReset && (
        <button
          onClick={onReset}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            'border border-destructive/50 text-destructive hover:bg-destructive/10'
          )}
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
};

export default GameSettings;
