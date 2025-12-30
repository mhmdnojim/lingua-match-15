import React from 'react';
import { cn } from '@/lib/utils';
import { GameMode } from '@/utils/gameLogic';
import { Columns2, Columns3, Eye, EyeOff, Volume2, VolumeX, Music, Music2 } from 'lucide-react';

interface GameSettingsProps {
  mode: GameMode;
  showPinyin: boolean;
  muteVoice: boolean;
  muteSfx: boolean;
  onModeChange: (mode: GameMode) => void;
  onShowPinyinChange: (show: boolean) => void;
  onMuteVoiceChange: (mute: boolean) => void;
  onMuteSfxChange: (mute: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export const GameSettings: React.FC<GameSettingsProps> = ({
  mode,
  showPinyin,
  muteVoice,
  muteSfx,
  onModeChange,
  onShowPinyinChange,
  onMuteVoiceChange,
  onMuteSfxChange,
  disabled = false,
  className,
}) => {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      {/* Column Mode Toggle */}
      <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
        <button
          onClick={() => onModeChange('2-column')}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            mode === '2-column' 
              ? 'bg-primary text-primary-foreground' 
              : 'text-muted-foreground hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Columns2 className="w-4 h-4" />
          <span className="hidden sm:inline">2-Column</span>
        </button>
        <button
          onClick={() => onModeChange('3-column')}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
            mode === '3-column' 
              ? 'bg-primary text-primary-foreground' 
              : 'text-muted-foreground hover:text-foreground',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          <Columns3 className="w-4 h-4" />
          <span className="hidden sm:inline">3-Column</span>
        </button>
      </div>

      {/* Pinyin Toggle (only in 2-column mode) */}
      {mode === '2-column' && (
        <button
          onClick={() => onShowPinyinChange(!showPinyin)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            'border border-border',
            showPinyin 
              ? 'bg-accent/20 text-accent border-accent/50' 
              : 'bg-secondary text-muted-foreground'
          )}
        >
          {showPinyin ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span className="hidden sm:inline">Pinyin</span>
        </button>
      )}

      {/* Audio Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onMuteVoiceChange(!muteVoice)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            'border border-border',
            !muteVoice 
              ? 'bg-primary/20 text-primary border-primary/50' 
              : 'bg-secondary text-muted-foreground'
          )}
          title={muteVoice ? 'Unmute voice' : 'Mute voice'}
        >
          {muteVoice ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={() => onMuteSfxChange(!muteSfx)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            'border border-border',
            !muteSfx 
              ? 'bg-warning/20 text-warning border-warning/50' 
              : 'bg-secondary text-muted-foreground'
          )}
          title={muteSfx ? 'Unmute sound effects' : 'Mute sound effects'}
        >
          {muteSfx ? <Music2 className="w-4 h-4" /> : <Music className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

export default GameSettings;
