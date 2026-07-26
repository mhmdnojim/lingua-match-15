import React from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, Volume2, VolumeX, Music, Music2, Mic, Crown, Type, Shuffle, ListOrdered, Languages, Pencil, SlidersHorizontal, ChevronUp, Layers, FileStack, Wand2, Palette } from 'lucide-react';
import { ColumnConfig } from '@/utils/gameLogic';
import { getLanguage, columnStyle } from '@/utils/languages';
import { THEMES } from '@/utils/themes';

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
  /** Render the built-in Options toggle button (false when it lives in the header) */
  showToggle?: boolean;
  /** Extra controls rendered at the start of the expanded panel (e.g. file picker) */
  extraControls?: React.ReactNode;
  /** Translate only the current batch or the whole uploaded file */
  translateScope?: 'batch' | 'all';
  onTranslateScopeChange?: (scope: 'batch' | 'all') => void;
  /** Translate every remaining word in the file right now */
  onTranslateWholeFile?: () => void;
  translating?: boolean;
  /** Selected color theme id */
  themeId?: string;
  onThemeChange?: (id: string) => void;
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
  showToggle = true,
  extraControls,
  translateScope = 'batch',
  onTranslateScopeChange,
  onTranslateWholeFile,
  translating = false,
  themeId = 'forest',
  onThemeChange,

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
      {extraControls}
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


      {/* Translation scope: current batch vs whole file */}
      <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
        <button
          onClick={() => onTranslateScopeChange?.('batch')}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all',
            translateScope === 'batch' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
          title="Translate only the words in the current round"
        >
          <Layers className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Batch</span>
        </button>
        <button
          onClick={() => onTranslateScopeChange?.('all')}
          disabled={disabled}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all',
            translateScope === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground',
          )}
          title="Translate the whole file automatically"
        >
          <FileStack className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden sm:inline">Whole file</span>
        </button>
      </div>

      {/* Translate everything that is still missing, right now */}
      <button
        onClick={onTranslateWholeFile}
        disabled={disabled || translating}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
          'bg-secondary border-border text-muted-foreground hover:text-foreground',
          (disabled || translating) && 'opacity-50 cursor-not-allowed',
        )}
        title="Translate every remaining word in this file now"
      >
        <Wand2 className="w-4 h-4 shrink-0" />
        <span className="hidden sm:inline">Translate rest</span>
      </button>

      {/* Transliteration — one toggle per column */}
      {romanizableColumns.length > 0 && (
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          {romanizableColumns.map(column => {
            const language = getLanguage(column.lang);
            return (
              <button
                key={`rom-${column.lang}`}
                onClick={() => onColumnRomanizationChange(column.lang, !column.showRomanization)}
                disabled={disabled}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all',
                  column.showRomanization
                    ? 'bg-game-pinyin text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                  disabled && 'opacity-50 cursor-not-allowed',
                )}
                title={`${column.showRomanization ? 'Hide' : 'Show'} transliteration on ${language.name} cards`}
              >
                <Languages className="w-4 h-4 shrink-0" />
                <span>{language.short}</span>
              </button>
            );
          })}
        </div>
      )}


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

      {/* Theme picker */}
      {onThemeChange && (
        <div className="flex items-center gap-1 rounded-lg bg-secondary p-1" title="Color theme">
          <Palette className="ml-1 h-4 w-4 shrink-0 text-muted-foreground" />
          {THEMES.map(theme => (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              title={theme.name}
              aria-label={`${theme.name} theme`}
              className={cn(
                'flex h-6 w-6 overflow-hidden rounded-full border transition-all',
                themeId === theme.id ? 'border-primary ring-2 ring-primary/60' : 'border-border hover:opacity-80',
              )}
            >
              {theme.swatch.map((color, i) => (
                <span key={i} className="h-full flex-1" style={{ backgroundColor: `hsl(${color})` }} />
              ))}
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
