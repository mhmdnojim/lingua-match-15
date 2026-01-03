import React from 'react';
import { cn } from '@/lib/utils';
import Card, { FontSize } from './Card';
import { GameCard, CardType } from '@/utils/gameLogic';
import { ColumnVisibility, ColumnMute } from './GameSettings';
import { HelpCircle } from 'lucide-react';

interface GameBoardProps {
  chineseCards: GameCard[];
  pinyinCards: GameCard[];
  englishCards: GameCard[];
  arabicCards: GameCard[];
  showPinyin: boolean;
  showArabic: boolean;
  columnVisibility: ColumnVisibility;
  columnMute: ColumnMute;
  fontSize?: FontSize;
  onCardClick: (card: GameCard) => void;
  onSpeak: (text: string, language: 'chinese' | 'english' | 'arabic', cardType: string) => void;
  onHint: (card: GameCard) => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  chineseCards,
  pinyinCards,
  englishCards,
  arabicCards,
  showPinyin,
  showArabic,
  columnVisibility,
  columnMute,
  fontSize = 'medium',
  onCardClick,
  onSpeak,
  onHint,
}) => {
  // Calculate visible columns based on visibility settings
  const visibleColumns: string[] = [];
  if (columnVisibility.chinese) visibleColumns.push('chinese');
  if (columnVisibility.pinyin && pinyinCards.length > 0) visibleColumns.push('pinyin');
  if (columnVisibility.english) visibleColumns.push('english');
  if (showArabic && columnVisibility.arabic && arabicCards.length > 0) visibleColumns.push('arabic');
  
  const columnCount = visibleColumns.length;
  
  return (
    <div className={cn(
      'grid gap-4 md:gap-6',
      columnCount === 1 && 'grid-cols-1 max-w-md mx-auto',
      columnCount === 2 && 'grid-cols-2',
      columnCount === 3 && 'grid-cols-3',
      columnCount === 4 && 'grid-cols-4'
    )}>
      {/* Chinese Column */}
      {columnVisibility.chinese && (
        <div className="flex flex-col gap-3">
          <h3 className="text-center text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            中文 CHINESE
          </h3>
          {chineseCards.map((card) => (
            <div key={card.id} className="relative group">
              <Card
                card={card}
                showPinyin={showPinyin}
                fontSize={fontSize}
                onClick={onCardClick}
                onSpeak={(text, lang) => onSpeak(text, lang, 'chinese')}
              />
              {!card.isMatched && (
                <button
                  onClick={(e) => { e.stopPropagation(); onHint(card); }}
                  className="absolute -right-2 -top-2 p-1 bg-warning text-warning-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:scale-110"
                  title="Get hint (-5 points)"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pinyin Column */}
      {columnVisibility.pinyin && pinyinCards.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-center text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            拼音 PINYIN
          </h3>
          {pinyinCards.map((card) => (
            <div key={card.id} className="relative group">
              <Card
                card={card}
                fontSize={fontSize}
                onClick={onCardClick}
              />
              {!card.isMatched && (
                <button
                  onClick={(e) => { e.stopPropagation(); onHint(card); }}
                  className="absolute -right-2 -top-2 p-1 bg-warning text-warning-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:scale-110"
                  title="Get hint (-5 points)"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* English Column */}
      {columnVisibility.english && (
        <div className="flex flex-col gap-3">
          <h3 className="text-center text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            ENGLISH
          </h3>
          {englishCards.map((card) => (
            <div key={card.id} className="relative group">
              <Card
                card={card}
                fontSize={fontSize}
                onClick={onCardClick}
                onSpeak={(text, lang) => onSpeak(text, lang, 'english')}
              />
              {!card.isMatched && (
                <button
                  onClick={(e) => { e.stopPropagation(); onHint(card); }}
                  className="absolute -right-2 -top-2 p-1 bg-warning text-warning-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:scale-110"
                  title="Get hint (-5 points)"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Arabic Column (optional) */}
      {showArabic && columnVisibility.arabic && arabicCards.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-center text-sm font-medium text-muted-foreground mb-2 tracking-wider">
            عربي ARABIC
          </h3>
          {arabicCards.map((card) => (
            <div key={card.id} className="relative group">
              <Card
                card={card}
                fontSize={fontSize}
                onClick={onCardClick}
                onSpeak={(text, lang) => onSpeak(text, lang, 'arabic')}
              />
              {!card.isMatched && (
                <button
                  onClick={(e) => { e.stopPropagation(); onHint(card); }}
                  className="absolute -right-2 -top-2 p-1 bg-warning text-warning-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:scale-110"
                  title="Get hint (-5 points)"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GameBoard;