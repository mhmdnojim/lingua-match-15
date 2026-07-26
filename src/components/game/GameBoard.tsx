import React from 'react';
import { cn } from '@/lib/utils';
import Card, { FontSize } from './Card';
import { GameCard, ColumnConfig } from '@/utils/gameLogic';
import { getLanguage, columnStyle, MAIN_LANGUAGES, PICKABLE_LANGUAGES } from '@/utils/languages';
import { HelpCircle, RefreshCw } from 'lucide-react';

interface GameBoardProps {
  columns: ColumnConfig[];
  cards: Record<string, GameCard[]>;
  /** languages whose translations are currently being generated */
  loadingLangs?: string[];
  fontSize?: FontSize;
  onCardClick: (card: GameCard) => void;
  onSpeak: (card: GameCard) => void;
  onHint: (card: GameCard) => void;
  onRegenerateCard?: (card: GameCard) => void;
  /** change the language of a column straight from its title */
  onColumnLangChange?: (index: number, lang: string) => void;
  regeneratingIds?: string[];
}

export const GameBoard: React.FC<GameBoardProps> = ({
  columns,
  cards,
  loadingLangs = [],
  fontSize = 'medium',
  onCardClick,
  onSpeak,
  onHint,
  onRegenerateCard,
  onColumnLangChange,
  regeneratingIds = [],
}) => {
  const visibleColumns = columns.filter(
    c => c.visible && ((cards[c.lang]?.length ?? 0) > 0 || loadingLangs.includes(c.lang)),
  );
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
        const isPending = columnCards.length === 0 && loadingLangs.includes(column.lang);

        return (
          <div key={column.lang} className="flex flex-col gap-3">
            {onColumnLangChange ? (
              <div className="mb-2 flex items-center justify-center gap-1">
                <select
                  value={column.lang}
                  onChange={e => onColumnLangChange(originalIndex, e.target.value)}
                  aria-label={`Language for column ${originalIndex + 1}`}
                  className={cn(
                    'max-w-full cursor-pointer appearance-none truncate rounded-md border border-transparent bg-transparent px-2 py-1 text-center text-sm font-medium uppercase tracking-wider hover:border-border focus:outline-none focus:ring-2 focus:ring-primary',
                    style.text,
                  )}
                >
                  {(originalIndex === 0 ? MAIN_LANGUAGES : PICKABLE_LANGUAGES).map(option => (
                    <option
                      key={option.code}
                      value={option.code}
                      disabled={option.code !== column.lang && columns.some(c => c.lang === option.code)}
                      className="text-foreground"
                    >
                      {option.native} — {option.name}
                    </option>
                  ))}
                </select>
                {originalIndex === 0 && <span className="text-[10px] text-muted-foreground">(main)</span>}
              </div>
            ) : (
              <h3 className={cn('text-center text-sm font-medium mb-2 uppercase tracking-wider', style.text)}>
                {language.native}
                {originalIndex === 0 && <span className="ml-1 text-[10px] text-muted-foreground">(main)</span>}
              </h3>
            )}
            {isPending &&
              Array.from({ length: rowCount }).map((_, i) => (
                <div
                  key={`pending-${column.lang}-${i}`}
                  className="h-[76px] rounded-xl border border-border bg-muted/30 animate-pulse"
                />
              ))}
            {columnCards.map(card => (
              <div key={card.id} className="relative group">
                <Card
                  card={card}
                  columnIndex={originalIndex}
                  showRomanization={column.showRomanization}
                  fontSize={fontSize}
                  onClick={onCardClick}
                  onSpeak={column.muted ? undefined : onSpeak}
                />
                {!card.isMatched && (
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
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default GameBoard;
