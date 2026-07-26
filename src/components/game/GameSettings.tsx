import React from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Volume2, VolumeX, Music, Music2, Mic, Crown, Type, Shuffle, ListOrdered, Languages, Pencil, SlidersHorizontal, ChevronUp } from 'lucide-react';
import { ColumnConfig } from '@/utils/gameLogic';
import { getLanguage, columnStyle } from '@/utils/languages';

export type VoiceType = 'free' | 'premium';
export type FontSize = 'small' | 'medium' | 'large';

interface GameSettingsProps {
  columns: ColumnConfig[];
  shuffleMode: boolean;
  onShuffleModeChange: (shuffle: boolean) => void;
  onColumnVisibilityChange: (lang: string, visible: boolean) => void;
  onColumnMuteChange: (lang: string, mute: boolean) => void;
  onColumnRomanizationChange: (lang: string, show: boolean) => void;
  onOpenLanguages: () => void;
  onOpenWordEditor: () => void;
  muteSfx?: boolean;
  voiceType?: VoiceType;
  fontSize?: FontSize;
  onMuteSfxChange?: (mute: boolean) => void;
  onVoiceTypeChange?: (type: VoiceType) => void;
  onFontSizeChange?: (size: FontSize) => void;
  disabled?: boolean;
  className?: string;
  /** Whether the extra options row is expanded */
  settingsOpen?: boolean;
  onSettingsOpenChange?: (open: boolean) => void;
}

export const GameSettings: React.FC<GameSettingsProps> = ({
  columns,
  shuffleMode,
  onShuffleModeChange,
  onColumnVisibilityChange,
  onColumnMuteChange,
  onColumnRomanizationChange,
  onOpenLanguages,
  onOpenWordEditor,
  muteSfx = false,
  voiceType = 'free',
  fontSize = 'medium',
  onMuteSfxChange,
  onVoiceTypeChange,
  onFontSizeChange,
  disabled = false,
  className,
  settingsOpen = false,
  onSettingsOpenChange,
}) => {
  const romanizableColumns = columns.filter(c => getLanguage(c.lang).romanizationLabel);

  return (
    <div className={cn(settingsOpen ? 'space-y-2' : '', className)}>
      {showToggle && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => onSettingsOpenChange?.(!settingsOpen)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
              settingsOpen
                ? 'bg-primary border-primary text-primary-foreground'
                : 'bg-secondary border-border text-muted-foreground hover:text-foreground',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
            title={settingsOpen ? 'Hide options' : 'Show options'}
          >
            <SlidersHorizontal className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Options</span>
            <ChevronUp className={cn('w-3.5 h-3.5 transition-transform', !settingsOpen && 'rotate-180')} />
          </button>
        </div>
      )}

      {/* Everything else — hidden until needed */}
      {settingsOpen && (
        <div className="flex flex-wrap items-center justify-center gap-2 rounded-lg border border-border bg-card/60 p-2">
      {/* Language / column setup */}
      <button
        onClick={onOpenLanguages}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
          'bg-primary border-primary text-primary-foreground hover:opacity-90',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        title="Choose the language of each column"
      >
        <Languages className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline">Languages</span>
      </button>

      {/* Word editor */}
      <button
        onClick={onOpenWordEditor}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
          'bg-secondary border-border text-muted-foreground hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        title="Edit or regenerate translations"
      >
        <Pencil className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline">Words</span>
      </button>

      {/* Shuffle/Order Toggle */}
      <button
        onClick={() => onShuffleModeChange(!shuffleMode)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
          shuffleMode
            ? 'bg-primary border-primary text-primary-foreground'
            : 'bg-secondary border-border text-muted-foreground hover:text-foreground',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        title={shuffleMode ? 'Shuffle mode (click to switch to sequential)' : 'Sequential mode (click to shuffle)'}
      >
        {shuffleMode ? <Shuffle className="w-4 h-4 shrink-0" /> : <ListOrdered className="w-4 h-4 shrink-0" />}
        <span className="hidden sm:inline text-center w-[3.75rem]">{shuffleMode ? 'Shuffle' : 'Order'}</span>
      </button>


      {romanizableColumns.map(column => {
        const language = getLanguage(column.lang);
        return (
          <button
            key={`rom-${column.lang}`}
            onClick={() => onColumnRomanizationChange(column.lang, !column.showRomanization)}
            disabled={disabled}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
              column.showRomanization
                ? 'bg-game-pinyin border-game-pinyin text-primary-foreground'
                : 'bg-secondary border-border text-muted-foreground hover:text-foreground',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
            title={`${column.showRomanization ? 'Hide' : 'Show'} ${language.romanizationLabel} on ${language.name} cards`}
          >
            <span className="text-xs">{language.short}</span>
            <span className="hidden sm:inline">{language.romanizationLabel}</span>
          </button>
        );
      })}

      {/* Column visibility */}
      <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
        {columns.map((column, index) => {
          const language = getLanguage(column.lang);
          const style = columnStyle(index);
          return (
            <button
              key={`vis-${column.lang}`}
              onClick={() => onColumnVisibilityChange(column.lang, !column.visible)}
              disabled={disabled}
              className={cn(
                'flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all',
                column.visible ? cn(style.solid, 'text-primary-foreground') : 'text-muted-foreground hover:text-foreground',
                disabled && 'opacity-50 cursor-not-allowed',
              )}
              title={`${column.visible ? 'Hide' : 'Show'} ${language.name} column`}
            >
              {column.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              <span>{language.short}</span>
            </button>
          );
        })}
      </div>

      {/* Column mute */}
      <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
        <span className="text-xs text-muted-foreground px-1">🔊</span>
        {columns.map((column, index) => {
          const language = getLanguage(column.lang);
          const style = columnStyle(index);
          return (
            <button
              key={`mute-${column.lang}`}
              onClick={() => onColumnMuteChange(column.lang, !column.muted)}
              disabled={disabled}
              className={cn(
                'flex items-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-all',
                !column.muted
                  ? cn(style.solid, 'text-primary-foreground')
                  : 'text-muted-foreground hover:text-foreground line-through',
                disabled && 'opacity-50 cursor-not-allowed',
              )}
              title={`${column.muted ? 'Unmute' : 'Mute'} ${language.name} voice`}
            >
              {column.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              <span>{language.short}</span>
            </button>
          );
        })}
      </div>

      {/* Voice Type Toggle */}
      {onVoiceTypeChange && (
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          <button
            onClick={() => onVoiceTypeChange('free')}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-all',
              voiceType === 'free' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
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
              voiceType === 'premium' ? 'bg-warning text-warning-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
            title="Premium voice"
          >
            <Crown className="w-4 h-4" />
            <span className="hidden sm:inline">Premium</span>
          </button>
        </div>
      )}

      {/* Font Size Toggle */}
      {onFontSizeChange && (
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          {(['small', 'medium', 'large'] as FontSize[]).map((size, i) => (
            <button
              key={size}
              onClick={() => onFontSizeChange(size)}
              className={cn(
                'flex items-center gap-1 px-2 py-1.5 rounded-md font-medium transition-all',
                fontSize === size ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
              )}
              title={`${size} font`}
            >
              <Type className={i === 0 ? 'w-3 h-3' : i === 1 ? 'w-4 h-4' : 'w-5 h-5'} />
            </button>
          ))}
        </div>
      )}

      {/* Mute SFX Toggle */}
      {onMuteSfxChange && (
        <button
          onClick={() => onMuteSfxChange(!muteSfx)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
            muteSfx
              ? 'bg-secondary border-border text-muted-foreground'
              : 'bg-primary border-primary text-primary-foreground',
          )}
          title={muteSfx ? 'Unmute effects' : 'Mute effects'}
        >
          {muteSfx ? <Music2 className="w-4 h-4" /> : <Music className="w-4 h-4" />}
        </button>
      )}
        </div>
      )}
    </div>
  );
};

export default GameSettings;
