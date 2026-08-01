import React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { cn } from '@/lib/utils';
import Card, { FontSize } from './Card';
import { GameCard, ColumnConfig } from '@/utils/gameLogic';
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getLanguage, columnStyle, MAIN_LANGUAGES, PICKABLE_LANGUAGES, romanizationCodeFor } from '@/utils/languages';
import { HelpCircle, RefreshCw, Pencil, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';


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
  /** card ids currently blinking from a hint */
  hintedIds?: string[];
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
  hintedIds = [],
}) => {

  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingCard, setEditingCard] = React.useState<GameCard | null>(null);
  const [draft, setDraft] = React.useState('');

  const startEdit = (card: GameCard) => {
    setEditingId(card.id);
    setEditingCard(card);
    setDraft(card.content);
  };
  const closeEdit = () => {
    setEditingId(null);
    setEditingCard(null);
  };
  const commitEdit = (card: GameCard) => {
    const value = draft.trim();
    closeEdit();
    if (value && value !== card.content) onEditCard?.(card, value);
  };
  // A column the user turned on always stays on the board — even while its words
  // are still empty (it shows placeholders instead of vanishing).
  const visibleColumns = columns.filter(c => c.visible);
  const count = visibleColumns.length;
  const rowCount = Math.max(1, ...columns.map(c => cards[c.lang]?.length ?? 0));


  return (
    <>
    <div
      className={cn(
        'grid gap-x-2 gap-y-1.5 md:gap-x-4 md:gap-y-2',
        count <= 1 && 'grid-cols-1 max-w-md mx-auto',
        count === 2 && 'grid-cols-2',
        count === 3 && 'grid-cols-3',
        count >= 4 && 'grid-cols-4',
      )}
    >
      {visibleColumns.map(column => {
        const language = getLanguage(column.lang);
        const originalIndex = columns.findIndex(c => c.lang === column.lang);
        const style = columnStyle(column.colorIndex ?? originalIndex);
        const columnCards = cards[column.lang] || [];
        const isPending = columnCards.length === 0;

        return (
          <div key={column.lang} className="flex flex-col gap-1.5 md:gap-2">
            {onColumnLangChange ? (
              <div className="mb-0 flex w-full flex-col items-start">
                <span className="h-3 text-[9px] leading-3 uppercase tracking-wider text-muted-foreground">
                  {originalIndex === 0 ? 'main' : ''}
                </span>
                <Select value={column.lang} onValueChange={value => onColumnLangChange(originalIndex, value)}>

                  <SelectTrigger
                    aria-label={`Language for column ${originalIndex + 1}`}
                    className={cn(
                      'h-7 w-full justify-between gap-1 overflow-hidden border-transparent bg-transparent px-0 text-left text-xs sm:text-sm font-medium uppercase tracking-wider [&>span]:truncate hover:border-border focus:ring-2 focus:ring-primary',
                      style.text,
                    )}
                  >
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent className="max-h-72">
                    {(() => {
                      // Transliterations are never listed here — they are a display
                      // option shown above the word on the card itself.
                      const base = (originalIndex === 0 ? MAIN_LANGUAGES : PICKABLE_LANGUAGES).filter(
                        l => !l.romanizationOf,
                      );
                      const currentLang = column.lang;
                      const columnLangs = columns.map(c => c.lang);

                      const baseCodes = new Set(base.map(l => l.code));
                      const missingColumnLangs = columnLangs.filter(
                        code => !baseCodes.has(code) && !getLanguage(code).romanizationOf,
                      );
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
                        hasTranslit: (() => {
                          const rom = romanizationCodeFor(option.code);
                          return Boolean(rom && readyLangs.includes(rom));
                        })(),
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
                        {option.hasTranslit && (
                          <span
                            className="ml-1.5 rounded bg-accent px-1 text-[10px] uppercase text-accent-foreground"
                            title="Transliteration available in your file"
                          >
                            Aa
                          </span>
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
              <h3 className={cn('text-center text-sm font-medium mb-0.5 uppercase tracking-wider', style.text)}>
                {language.name}
              </h3>
            )}

            {isPending &&
              Array.from({ length: rowCount }).map((_, i) => (
                <div
                  key={`pending-${column.lang}-${i}`}
                  className="h-[56px] sm:h-[72px] md:h-[84px] rounded-xl border border-border bg-muted/30 animate-pulse"
                />
              ))}
            {columnCards.map(card => {
              const isEditing = editingId === card.id;
              return (
              <div key={card.id} className="relative group">
                <Card
                  card={card}
                  columnIndex={column.colorIndex ?? originalIndex}
                  showRomanization={column.showRomanization}
                  fontSize={column.fontSize ?? fontSize}
                  isHinted={hintedIds.includes(card.id)}
                  isBusy={regeneratingIds.includes(card.id)}
                  onClick={onCardClick}
                  onSpeak={column.muted ? undefined : onSpeak}
                />

                {!card.isMatched && !isEditing && (
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      onHint(card);
                    }}
                    className="absolute -left-2 -bottom-2 grid h-7 w-7 place-items-center rounded-full bg-warning text-warning-foreground ring-2 ring-background shadow-lg opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all hover:scale-110 z-20"
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
                    className="absolute -left-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-secondary text-secondary-foreground ring-2 ring-background shadow-lg opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-all hover:scale-110 z-20"
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
                    className={cn(
                      'absolute -right-2 -bottom-2 grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-background shadow-lg transition-all hover:scale-110 z-20',
                      regeneratingIds.includes(card.id)
                        ? 'opacity-100'
                        : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100',
                    )}
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

    <Dialog open={!!editingCard} onOpenChange={open => !open && closeEdit()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {editingCard ? getLanguage(editingCard.lang).name : ''} — edit word
          </DialogTitle>
          <DialogDescription>
            {editingCard && columns.findIndex(c => c.lang === editingCard.lang) === 0
              ? 'Editing the main word retranslates the other columns.'
              : 'Fix or rewrite this translation manually.'}
          </DialogDescription>
        </DialogHeader>
        {editingCard && (
          <>
            <Textarea
              autoFocus
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commitEdit(editingCard);
                if (e.key === 'Escape') closeEdit();
              }}
              dir={getLanguage(editingCard.lang).rtl ? 'rtl' : 'ltr'}
              rows={4}
              className={cn(
                'min-h-[120px] text-xl leading-relaxed',
                getLanguage(editingCard.lang).fontClass,
              )}
              aria-label="Edit word"
            />
            <DialogFooter>
              <Button variant="ghost" onClick={() => closeEdit()}>
                Cancel
              </Button>
              <Button onClick={() => commitEdit(editingCard)}>
                <Check className="mr-1 h-4 w-4" /> Save
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
    </>
  );

};

export default GameBoard;
