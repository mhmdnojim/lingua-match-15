import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '@/lib/utils';
import Card, { FontSize } from './Card';
import { GameCard, ColumnConfig } from '@/utils/gameLogic';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getLanguage, columnStyle, MAIN_LANGUAGES, PICKABLE_LANGUAGES } from '@/utils/languages';
import { HelpCircle, RefreshCw, Pencil, Check, X } from 'lucide-react';


interface GameBoardProps {
  columns: ColumnConfig[];
  cards: Record<string, GameCard[]>;
  /** languages already available in the file / saved data (listed first in pickers) */
  readyLangs?: string[];
  /** languages whose translations are currently being generated */
  loadingLangs?: string[];

  fontSize?: FontSize;
  onCardClick: (card: GameCard) => void;
  onSpeak: (card: GameCard) => void;
  onHint: (card: GameCard) => void;
  onRegenerateCard?: (card: GameCard) => void;
  /** save a manual edit of one card; editing the main column retranslates the row */
  onEditCard?: (card: GameCard, value: string) => void;
  /** change the language of a column straight from its title */
  onColumnLangChange?: (index: number, lang: string) => void;
  regeneratingIds?: string[];
}

export const GameBoard: React.FC<GameBoardProps> = ({
  columns,
  cards,
  readyLangs = [],
  loadingLangs = [],

  fontSize = 'medium',
  onCardClick,
  onSpeak,
  onHint,
  onRegenerateCard,
  onEditCard,
  onColumnLangChange,
  regeneratingIds = [],
}) => {

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState('');

  const startEdit = (card: GameCard) => {
    setEditingId(card.id);
    setDraft(card.content);
  };
  const commitEdit = (card: GameCard) => {
    const value = draft.trim();
    setEditingId(null);
    if (value && value !== card.content) onEditCard?.(card, value);
  };
  // A column the user turned on always stays on the board — even while its words
  // are still empty (it shows placeholders instead of vanishing).
  const visibleColumns = columns.filter(c => c.visible);
  const count = visibleColumns.length;
  const rowCount = Math.max(1, ...columns.map(c => cards[c.lang]?.length ?? 0));


  return (
    <div
      className={cn(
        'grid gap-4 md:gap-6',
        count <= 1 && 'grid-cols-1 max-w-md mx-auto',
        count === 2 && 'grid-cols-2',
        count === 3 && 'grid-cols-3',
        count >= 4 && 'grid-cols-4',
      )}
    >
      {visibleColumns.map(column => {
        const language = getLanguage(column.lang);
        const originalIndex = columns.findIndex(c => c.lang === column.lang);
        const style = columnStyle(originalIndex);
        const columnCards = cards[column.lang] || [];
        const isPending = columnCards.length === 0;

        return (
          <div key={column.lang} className="flex flex-col gap-3">
            {onColumnLangChange ? (
              <div className="mb-2 flex w-full flex-col items-start">
                <span className="h-4 text-[10px] uppercase tracking-wider text-muted-foreground">
                  {originalIndex === 0 ? 'main' : ''}
                </span>
                <Select value={column.lang} onValueChange={value => onColumnLangChange(originalIndex, value)}>

                  <SelectTrigger
                    aria-label={`Language for column ${originalIndex + 1}`}
                    className={cn(
                      'h-8 w-full justify-between gap-1 overflow-hidden border-transparent bg-transparent px-0 text-left text-sm font-medium uppercase tracking-wider [&>span]:truncate hover:border-border focus:ring-2 focus:ring-primary',
                      style.text,
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent className="max-h-72">
                    {(() => {
                      const base = originalIndex === 0 ? MAIN_LANGUAGES : PICKABLE_LANGUAGES;
                      const currentLang = column.lang;
                      const columnLangs = columns.map(c => c.lang);

                      const baseCodes = new Set(base.map(l => l.code));
                      const missingColumnLangs = columnLangs.filter(code => !baseCodes.has(code));
                      const fullList = [...missingColumnLangs.map(getLanguage), ...base];

                      const current = fullList.filter(l => l.code === currentLang);
                      const otherColumnItems = fullList
                        .filter(l => {
                          const idx = columnLangs.indexOf(l.code);
                          return l.code !== currentLang && idx !== -1 && idx !== originalIndex;
                        })
                        .sort((a, b) => columnLangs.indexOf(a.code) - columnLangs.indexOf(b.code));

                      const shownCodes = new Set([...current, ...otherColumnItems].map(l => l.code));
                      const ready = fullList
                        .filter(l => !shownCodes.has(l.code) && readyLangs.includes(l.code))
                        .sort((a, b) => a.name.localeCompare(b.name));
                      const readyCodes = new Set(ready.map(l => l.code));
                      const rest = fullList
                        .filter(l => !shownCodes.has(l.code) && !readyCodes.has(l.code))
                        .sort((a, b) => a.name.localeCompare(b.name));

                      return [...current, ...otherColumnItems, ...ready, ...rest].map(option => ({
                        ...option,
                        isReady: readyLangs.includes(option.code),
                      }));
                    })().map(option => (
                      <SelectPrimitive.Item
                        key={option.code}
                        value={option.code}
                        textValue={option.name}
                        className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 focus:bg-accent focus:text-accent-foreground"
                      >
                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                          <SelectPrimitive.ItemIndicator>
                            <Check className="h-4 w-4" />
                          </SelectPrimitive.ItemIndicator>
                        </span>
                        <SelectPrimitive.ItemText>{option.name}</SelectPrimitive.ItemText>
                        <span className="ml-1 text-muted-foreground">— {option.native}</span>
                        {option.isReady && (
                          <span className="ml-1.5 rounded bg-primary/15 px-1 text-[10px] uppercase text-primary">ready</span>
                        )}
                        {option.code !== column.lang && columns.some(c => c.lang === option.code) && (
                          <span className="ml-1.5 rounded bg-muted px-1 text-[10px] uppercase text-muted-foreground">swap</span>
                        )}
                      </SelectPrimitive.Item>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <h3 className={cn('text-center text-sm font-medium mb-2 uppercase tracking-wider', style.text)}>
                {language.name}
              </h3>
            )}

            {isPending &&
              Array.from({ length: rowCount }).map((_, i) => (
                <div
                  key={`pending-${column.lang}-${i}`}
                  className="h-[76px] rounded-xl border border-border bg-muted/30 animate-pulse"
                />
              ))}
            {columnCards.map(card => {
              const isEditing = editingId === card.id;
              return (
              <div key={card.id} className="relative group">
                {isEditing ? (
                  <div className="flex min-h-[76px] items-center gap-2 rounded-xl border border-primary bg-card p-3 shadow-md">
                    <input
                      autoFocus
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') commitEdit(card);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                      className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none"
                      aria-label="Edit word"
                    />
                    <button
                      onClick={() => commitEdit(card)}
                      className="rounded-full bg-primary p-1 text-primary-foreground hover:scale-110 transition-transform"
                      title="Save"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="rounded-full bg-muted p-1 text-muted-foreground hover:scale-110 transition-transform"
                      title="Cancel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <Card
                    card={card}
                    columnIndex={originalIndex}
                    showRomanization={column.showRomanization}
                    fontSize={fontSize}
                    onClick={onCardClick}
                    onSpeak={column.muted ? undefined : onSpeak}
                  />
                )}
                {!card.isMatched && !isEditing && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onHint(card);
                    }}
                    className="absolute -right-2 -top-2 p-1 bg-warning text-warning-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:scale-110"
                    title="Get hint (-5 points)"
                  >
                    <HelpCircle className="w-4 h-4" />
                  </button>
                )}
                {onEditCard && !card.isMatched && !isEditing && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      startEdit(card);
                    }}
                    className="absolute -left-2 -top-2 p-1 bg-secondary text-secondary-foreground rounded-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity shadow-md hover:scale-110"
                    title={
                      originalIndex === 0
                        ? 'Edit word (retranslates the other columns)'
                        : 'Edit translation'
                    }
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                )}
                {onRegenerateCard && originalIndex !== 0 && !card.isMatched && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onRegenerateCard(card);
                    }}
                    disabled={regeneratingIds.includes(card.id)}
                    className="absolute -right-2 -bottom-2 p-1 bg-primary text-primary-foreground rounded-full opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity shadow-md hover:scale-110 disabled:opacity-100"
                    title="Regenerate translation"
                  >
                    <RefreshCw className={cn('w-4 h-4', regeneratingIds.includes(card.id) && 'animate-spin')} />
                  </button>
                )}
              </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default GameBoard;
