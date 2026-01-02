import React from 'react';
import { cn } from '@/lib/utils';
import Card, { FontSize } from './Card';
import { GameCard, GameMode } from '@/utils/gameLogic';

interface GameBoardProps {
  chineseCards: GameCard[];
  pinyinCards: GameCard[];
  englishCards: GameCard[];
  arabicCards: GameCard[];
  mode: GameMode;
  showPinyin: boolean;
  showArabic: boolean;
  fontSize?: FontSize;
  onCardClick: (card: GameCard) => void;
  onSpeak: (text: string, language: 'chinese' | 'english') => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  chineseCards,
  pinyinCards,
  englishCards,
  arabicCards,
  mode,
  showPinyin,
  showArabic,
  fontSize = 'medium',
  onCardClick,
  onSpeak,
}) => {
  // Calculate column count based on mode and Arabic visibility
  const columnCount = (mode === '3-column' ? 3 : 2) + (showArabic ? 1 : 0);
  
  return (
    <div className={cn(
      'grid gap-4 md:gap-6',
      columnCount === 2 && 'grid-cols-2',
      columnCount === 3 && 'grid-cols-3',
      columnCount === 4 && 'grid-cols-4'
    )}>
      {/* Chinese Column */}
      <div className="flex flex-col gap-3">
        <h3 className="text-center text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
          中文 CHINESE
        </h3>
        {chineseCards.map((card) => (
          <Card
            key={card.id}
            card={card}
            showPinyin={mode === '2-column' && showPinyin}
            fontSize={fontSize}
            onClick={onCardClick}
            onSpeak={onSpeak}
          />
        ))}
      </div>

      {/* Pinyin Column (3-column mode only) */}
      {mode === '3-column' && (
        <div className="flex flex-col gap-3">
          <h3 className="text-center text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
            拼音 PINYIN
          </h3>
          {pinyinCards.map((card) => (
            <Card
              key={card.id}
              card={card}
              fontSize={fontSize}
              onClick={onCardClick}
            />
          ))}
        </div>
      )}

      {/* English Column */}
      <div className="flex flex-col gap-3">
        <h3 className="text-center text-sm font-medium text-muted-foreground mb-2 uppercase tracking-wider">
          ENGLISH
        </h3>
        {englishCards.map((card) => (
          <Card
            key={card.id}
            card={card}
            fontSize={fontSize}
            onClick={onCardClick}
            onSpeak={onSpeak}
          />
        ))}
      </div>

      {/* Arabic Column (optional) */}
      {showArabic && arabicCards.length > 0 && (
        <div className="flex flex-col gap-3">
          <h3 className="text-center text-sm font-medium text-muted-foreground mb-2 tracking-wider">
            عربي ARABIC
          </h3>
          {arabicCards.map((card) => (
            <Card
              key={card.id}
              card={card}
              fontSize={fontSize}
              onClick={onCardClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default GameBoard;