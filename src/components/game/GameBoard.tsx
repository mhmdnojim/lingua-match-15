import React from 'react';
import { cn } from '@/lib/utils';
import Card, { FontSize } from './Card';
import { GameCard, ColumnConfig } from '@/utils/gameLogic';
import { getLanguage, columnStyle } from '@/utils/languages';
import { HelpCircle } from 'lucide-react';

interface GameBoardProps {
  columns: ColumnConfig[];
  cards: Record<string, GameCard[]>;
  fontSize?: FontSize;
  onCardClick: (card: GameCard) => void;
  onSpeak: (card: GameCard) => void;
  onHint: (card: GameCard) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  columns,
  cards,
  fontSize = 'medium',
  onCardClick,
  onSpeak,
  onHint,
}) => {
  const visibleColumns = columns.filter(c => c.visible && (cards[c.lang]?.length ?? 0) > 0);
  const count = visibleColumns.length;

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

        return (
          <div key={column.lang} className="flex flex-col gap-3">
            <h3 className={cn('text-center text-sm font-medium mb-2 uppercase tracking-wider', style.text)}>
              {language.native}
              {originalIndex === 0 && <span className="ml-1 text-[10px] text-muted-foreground">(main)</span>}
            </h3>
            {(cards[column.lang] || []).map(card => (
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
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default GameBoard;
