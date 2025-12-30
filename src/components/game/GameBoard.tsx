import React from 'react';
import { cn } from '@/lib/utils';
import Card, { FontSize } from './Card';
import { GameCard, GameMode } from '@/utils/gameLogic';

interface GameBoardProps {
  chineseCards: GameCard[];
  pinyinCards: GameCard[];
  englishCards: GameCard[];
  mode: GameMode;
  showPinyin: boolean;
  fontSize?: FontSize;
  onCardClick: (card: GameCard) => void;
  onSpeak: (text: string, language: 'chinese' | 'english') => void;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  chineseCards,
  pinyinCards,
  englishCards,
  mode,
  showPinyin,
  fontSize = 'medium',
  onCardClick,
  onSpeak,
}) => {
  return (
    <div className={cn(
      'grid gap-4 md:gap-6',
      mode === '2-column' ? 'grid-cols-2' : 'grid-cols-3'
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
    </div>
  );
};

export default GameBoard;