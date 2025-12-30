import React from 'react';
import { cn } from '@/lib/utils';
import { GameMode } from '@/utils/gameLogic';
import { Columns2, Columns3, Eye, EyeOff, RotateCcw, Volume2, VolumeX, Music, Music2, Mic, Crown, Type } from 'lucide-react';

export type VoiceType = 'free' | 'premium';
export type FontSize = 'small' | 'medium' | 'large';

interface GameSettingsProps {
  mode: GameMode;
  showPinyin: boolean;
  onModeChange: (mode: GameMode) => void;
  onShowPinyinChange: (show: boolean) => void;
  muteVoice?: boolean;
  muteSfx?: boolean;
  voiceType?: VoiceType;
  fontSize?: FontSize;
  onMuteVoiceChange?: (mute: boolean) => void;
  onMuteSfxChange?: (mute: boolean) => void;
  onVoiceTypeChange?: (type: VoiceType) => void;
  onFontSizeChange?: (size: FontSize) => void;
  onReset?: () => void;
  disabled?: boolean;
  className?: string;
}

export const GameSettings: React.FC<GameSettingsProps> = ({
  mode,
  showPinyin,
  onModeChange,
  onShowPinyinChange,
  muteVoice = false,
  muteSfx = false,
  voiceType = 'free',
  fontSize = 'medium',
  onMuteVoiceChange,
  onMuteSfxChange,
  onVoiceTypeChange,
  onFontSizeChange,
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
          <span>2 Col</span>
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
          <span>3 Col</span>
        </button>
      </div>

      {/* Pinyin Toggle (only in 2-column mode) */}
      {mode === '2-column' && (
        <button
          onClick={() => onShowPinyinChange(!showPinyin)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
            showPinyin 
              ? 'bg-primary border-primary text-primary-foreground' 
              : 'bg-secondary border-border text-muted-foreground'
          )}
        >
          {showPinyin ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          <span>Pinyin</span>
        </button>
      )}

      {/* Voice Type Toggle */}
      {onVoiceTypeChange && (
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          <button
            onClick={() => onVoiceTypeChange('free')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all',
              voiceType === 'free' 
                ? 'bg-card text-foreground border border-border' 
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Free voice (browser)"
          >
            <Mic className="w-4 h-4" />
            <span className="hidden sm:inline">Free</span>
          </button>
          <button
            onClick={() => onVoiceTypeChange('premium')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all',
              voiceType === 'premium' 
                ? 'bg-card text-warning border border-warning/50' 
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Premium voice (ElevenLabs)"
          >
            <Crown className="w-4 h-4" />
            <span className="hidden sm:inline">Premium</span>
          </button>
        </div>
      )}

      {/* Font Size Toggle */}
      {onFontSizeChange && (
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          <button
            onClick={() => onFontSizeChange('small')}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all',
              fontSize === 'small' 
                ? 'bg-card text-foreground border border-border' 
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Small font"
          >
            <Type className="w-3 h-3" />
          </button>
          <button
            onClick={() => onFontSizeChange('medium')}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 rounded-md text-sm font-medium transition-all',
              fontSize === 'medium' 
                ? 'bg-card text-foreground border border-border' 
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Medium font"
          >
            <Type className="w-4 h-4" />
          </button>
          <button
            onClick={() => onFontSizeChange('large')}
            className={cn(
              'flex items-center gap-1 px-2 py-1.5 rounded-md text-base font-medium transition-all',
              fontSize === 'large' 
                ? 'bg-card text-foreground border border-border' 
                : 'text-muted-foreground hover:text-foreground'
            )}
            title="Large font"
          >
            <Type className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Mute Voice Toggle */}
      {onMuteVoiceChange && (
        <button
          onClick={() => onMuteVoiceChange(!muteVoice)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
            muteVoice 
              ? 'bg-secondary border-border text-muted-foreground' 
              : 'bg-primary border-primary text-primary-foreground'
          )}
          title={muteVoice ? 'Unmute voice' : 'Mute voice'}
        >
          {muteVoice ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      )}

      {/* Mute SFX Toggle */}
      {onMuteSfxChange && (
        <button
          onClick={() => onMuteSfxChange(!muteSfx)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
            muteSfx 
              ? 'bg-secondary border-border text-muted-foreground' 
              : 'bg-primary border-primary text-primary-foreground'
          )}
          title={muteSfx ? 'Unmute effects' : 'Mute effects'}
        >
          {muteSfx ? <Music2 className="w-4 h-4" /> : <Music className="w-4 h-4" />}
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