import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { VocabularyItem, fetchExcelFromUrl, parseExcelFile, createBatches } from '@/utils/excelParser';
import { GameCard, createGameCards, checkMatch, getRequiredSelections, calculateAccuracy, shuffleArray } from '@/utils/gameLogic';
import { saveProgress, loadProgress, clearProgress, VoiceType, FontSize } from '@/utils/storage';
import { useAudio } from '@/hooks/useAudio';
import { supabase } from '@/integrations/supabase/client';
import GameBoard from './GameBoard';
import StatsPanel from './StatsPanel';
import ProgressBar from './ProgressBar';
import FileSelector from './FileSelector';
import GameSettings, { ColumnVisibility, ColumnMute } from './GameSettings';
import CelebrationModal from './CelebrationModal';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { BookOpen, LogIn, LogOut, User } from 'lucide-react';

const AVAILABLE_FILES = ['sample-vocabulary.xlsx'];
const BATCH_SIZE = 5;
const DEFAULT_FILE = 'sample-vocabulary.xlsx';

export interface VocabularyGameProps {
  dataSource?: string;
  batchSize?: number;
  showPinyin?: boolean;
  onComplete?: () => void;
  className?: string;
}

export const VocabularyGame: React.FC<VocabularyGameProps> = ({
  dataSource,
  batchSize = BATCH_SIZE,
  showPinyin: initialShowPinyin,
  onComplete,
  className,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const savedProgress = loadProgress();

  const [user, setUser] = useState<any>(null);

  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [batches, setBatches] = useState<VocabularyItem[][]>([]);
  const [currentBatch, setCurrentBatch] = useState(savedProgress.currentBatch);
  const [completedBatches, setCompletedBatches] = useState<number[]>(savedProgress.completedBatches);
  const [showPinyin, setShowPinyin] = useState(initialShowPinyin ?? savedProgress.showPinyin);
  const [showArabic, setShowArabic] = useState(savedProgress.showArabic);
  const [shuffleMode, setShuffleMode] = useState(true);
  const [shuffledVocabulary, setShuffledVocabulary] = useState<VocabularyItem[]>([]);
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    chinese: true,
    pinyin: true,
    english: true,
    arabic: true,
  });
  const [columnMute, setColumnMute] = useState<ColumnMute>({
    chinese: false,
    pinyin: false,
    english: false,
    arabic: false,
  });
  const [muteSfx, setMuteSfx] = useState(savedProgress.muteSfx);
  const [voiceType, setVoiceType] = useState<VoiceType>((savedProgress as any).voiceType || 'free');
  const [fontSize, setFontSize] = useState<FontSize>((savedProgress as any).fontSize || 'medium');
  // Default to sample vocabulary if no file selected
  const [selectedFile, setSelectedFile] = useState<string | null>(dataSource || savedProgress.selectedFile || DEFAULT_FILE);
  const [chineseCards, setChineseCards] = useState<GameCard[]>([]);
  const [pinyinCards, setPinyinCards] = useState<GameCard[]>([]);
  const [englishCards, setEnglishCards] = useState<GameCard[]>([]);
  const [arabicCards, setArabicCards] = useState<GameCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<GameCard[]>([]);
  const [score, setScore] = useState(savedProgress.score);
  const [time, setTime] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctMatches, setCorrectMatches] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [batchScore, setBatchScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [fourthColumnHeader, setFourthColumnHeader] = useState<string | undefined>();

  const { speak, playSuccess, playError, playCelebration, stopAudio } = useAudio({ muteVoice: false, muteSfx, voiceType });

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Timer
  useEffect(() => {
    if (!gameStarted || showCelebration) return;
    const interval = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [gameStarted, showCelebration]);

  // Load vocabulary
  const loadVocabulary = useCallback(async (fileName: string) => {
    setIsLoading(true);
    try {
      const result = await fetchExcelFromUrl(`/datasets/${fileName}`);
      if (result.success) {
        setVocabulary(result.data);
        setFourthColumnHeader(result.fourthColumnHeader);
        const newBatches = createBatches(result.data, batchSize);
        setBatches(newBatches);
        toast({ title: 'Vocabulary loaded', description: `${result.data.length} words loaded` });
      } else {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load vocabulary', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [batchSize, toast]);

  useEffect(() => {
    if (selectedFile) {
      loadVocabulary(selectedFile);
      saveProgress({ selectedFile });
    }
  }, [selectedFile, loadVocabulary]);

  // Check if vocabulary has Arabic data
  const hasArabicData = vocabulary.some(item => item.arabic && item.arabic.trim() !== '');

  // Initialize batch cards - only when batch changes or shuffle mode changes
  const initializeBatch = useCallback((batchIndex: number) => {
    if (!batches[batchIndex]) return;
    // Always create cards with pinyin data for both modes
    const cards = createGameCards(batches[batchIndex], '3-column', true, showArabic, shuffleMode);
    setChineseCards(cards.chinese);
    setPinyinCards(cards.pinyin);
    setEnglishCards(cards.english);
    setArabicCards(cards.arabic);
    setSelectedCards([]);
    setMatchedPairs(0);
    setTime(0);
    setAttempts(0);
    setCorrectMatches(0);
    setBatchScore(0);
    setGameStarted(true);
  }, [batches, showArabic, shuffleMode]);

  // Handle shuffle mode change - reinitialize batch with new shuffle setting
  const handleShuffleModeChange = useCallback((shuffle: boolean) => {
    setShuffleMode(shuffle);
    // Reinitialize current batch with new shuffle mode
    if (batches[currentBatch]) {
      const cards = createGameCards(batches[currentBatch], '3-column', true, showArabic, shuffle);
      setChineseCards(cards.chinese);
      setPinyinCards(cards.pinyin);
      setEnglishCards(cards.english);
      setArabicCards(cards.arabic);
      setSelectedCards([]);
    }
  }, [batches, currentBatch, showArabic]);

  // Handle column visibility change
  const handleColumnVisibilityChange = useCallback((column: keyof ColumnVisibility, visible: boolean) => {
    setColumnVisibility(prev => ({ ...prev, [column]: visible }));
  }, []);

  // Handle column mute change
  const handleColumnMuteChange = useCallback((column: keyof ColumnMute, mute: boolean) => {
    setColumnMute(prev => ({ ...prev, [column]: mute }));
  }, []);

  // Speak with column mute awareness
  const speakWithMute = useCallback((text: string, language: 'chinese' | 'english' | 'arabic', cardType: string) => {
    if (cardType === 'chinese' && columnMute.chinese) return;
    if (cardType === 'english' && columnMute.english) return;
    if (cardType === 'arabic' && columnMute.arabic) return;
    speak(text, language as 'chinese' | 'english');
  }, [speak, columnMute]);

  // Handle hint request - reveal matching cards for the selected card
  const handleHint = useCallback((card: GameCard) => {
    const vocabId = card.vocabId;
    
    // Find all matching cards across all columns
    const highlightMatching = (cards: GameCard[]) => 
      cards.map(c => c.vocabId === vocabId && !c.isMatched ? { ...c, isSelected: true } : c);
    
    setChineseCards(highlightMatching);
    setPinyinCards(highlightMatching);
    setEnglishCards(highlightMatching);
    setArabicCards(highlightMatching);
    
    // Auto-select all matching cards
    const allCards = [...chineseCards, ...pinyinCards, ...englishCards, ...arabicCards];
    const matchingCards = allCards.filter(c => c.vocabId === vocabId && !c.isMatched);
    setSelectedCards(matchingCards);
    
    toast({ 
      title: 'Hint used', 
      description: 'Matching cards highlighted! -5 points',
      variant: 'default'
    });
    setScore(s => Math.max(0, s - 5));
    setBatchScore(s => Math.max(0, s - 5));
  }, [chineseCards, pinyinCards, englishCards, arabicCards, toast]);

  useEffect(() => {
    if (batches.length > 0) {
      initializeBatch(currentBatch);
    }
    // Note: gameMode is intentionally excluded to prevent reshuffling when switching modes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batches, currentBatch, initializeBatch]);

  // Handle card click
  const handleCardClick = useCallback((card: GameCard) => {
    if (card.isMatched || card.isError) return;
    const alreadySelected = selectedCards.find(c => c.id === card.id);
    if (alreadySelected) {
      setSelectedCards(selectedCards.filter(c => c.id !== card.id));
      updateCardSelection(card.id, false);
      return;
    }
    const sameTypeSelected = selectedCards.find(c => c.type === card.type);
    if (sameTypeSelected) {
      updateCardSelection(sameTypeSelected.id, false);
      setSelectedCards(prev => [...prev.filter(c => c.type !== card.type), card]);
    } else {
      setSelectedCards(prev => [...prev, card]);
    }
    updateCardSelection(card.id, true);
  }, [selectedCards]);

  const updateCardSelection = (cardId: string, isSelected: boolean) => {
    const update = (cards: GameCard[]) => cards.map(c => c.id === cardId ? { ...c, isSelected } : c);
    setChineseCards(update);
    setPinyinCards(update);
    setEnglishCards(update);
    setArabicCards(update);
  };

  // Check for match - count visible columns for required selections
  useEffect(() => {
    // Calculate required selections based on visible columns
    let requiredCount = 0;
    if (columnVisibility.chinese) requiredCount++;
    if (columnVisibility.pinyin && pinyinCards.length > 0) requiredCount++;
    if (columnVisibility.english) requiredCount++;
    if (columnVisibility.arabic && showArabic && arabicCards.length > 0) requiredCount++;
    
    if (selectedCards.length !== requiredCount || requiredCount < 2) return;

    setAttempts(a => a + 1);
    
    // Check if all selected cards have the same vocabId
    const vocabIds = selectedCards.map(c => c.vocabId);
    const isMatch = vocabIds.every(id => id === vocabIds[0]);

    if (isMatch) {
      playSuccess();
      setCorrectMatches(c => c + 1);
      setScore(s => s + 10);
      setBatchScore(s => s + 10);
      setMatchedPairs(m => m + 1);

      const matchCards = (cards: GameCard[]) => cards.map(c => 
        selectedCards.some(s => s.id === c.id) ? { ...c, isMatched: true, isSelected: false } : c
      );
      setChineseCards(matchCards);
      setPinyinCards(matchCards);
      setEnglishCards(matchCards);
      setArabicCards(matchCards);
      setSelectedCards([]);

      if (matchedPairs + 1 === batches[currentBatch]?.length) {
        setTimeout(() => {
          playCelebration();
          setShowCelebration(true);
          if (!completedBatches.includes(currentBatch)) {
            const newCompleted = [...completedBatches, currentBatch];
            setCompletedBatches(newCompleted);
            saveProgress({ completedBatches: newCompleted, score: score + 10 });
          }
        }, 600);
      }
    } else {
      playError();
      const errorCards = (cards: GameCard[]) => cards.map(c => 
        selectedCards.some(s => s.id === c.id) ? { ...c, isError: true } : c
      );
      setChineseCards(errorCards);
      setPinyinCards(errorCards);
      setEnglishCards(errorCards);
      setArabicCards(errorCards);

      setTimeout(() => {
        const clearError = (cards: GameCard[]) => cards.map(c => ({ ...c, isError: false, isSelected: false }));
        setChineseCards(clearError);
        setPinyinCards(clearError);
        setEnglishCards(clearError);
        setArabicCards(clearError);
        setSelectedCards([]);
      }, 500);
    }
  }, [selectedCards, columnVisibility, showArabic, pinyinCards.length, arabicCards.length, playSuccess, playError, playCelebration, matchedPairs, batches, currentBatch, completedBatches, score]);

  const handleSelectBatch = (index: number) => {
    setCurrentBatch(index);
    saveProgress({ currentBatch: index });
    setShowCelebration(false);
  };

  const handleNextBatch = () => {
    setShowCelebration(false);
    if (currentBatch < batches.length - 1) {
      handleSelectBatch(currentBatch + 1);
    } else {
      onComplete?.();
    }
  };

  const handleUploadFile = async (file: File) => {
    setIsLoading(true);
    const result = await parseExcelFile(file);
    if (result.success) {
      setVocabulary(result.data);
      setFourthColumnHeader(result.fourthColumnHeader);
      setBatches(createBatches(result.data, batchSize));
      setCurrentBatch(0);
      setScore(0);
      setCompletedBatches([]);
      toast({ title: 'File uploaded', description: `${result.data.length} words loaded` });
    } else {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
    }
    setIsLoading(false);
  };

  const handleReset = () => {
    clearProgress();
    setScore(0);
    setCompletedBatches([]);
    setCurrentBatch(0);
    initializeBatch(0);
    toast({ title: 'Game reset', description: 'All progress has been cleared' });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({ title: 'Logged out', description: 'You have been signed out' });
  };

  useEffect(() => {
    saveProgress({ showPinyin, showArabic, muteSfx, voiceType, fontSize } as any);
  }, [showPinyin, showArabic, muteSfx, voiceType, fontSize]);

  return (
    <div className={cn('min-h-screen bg-background p-4 md:p-6', className)}>
      <div className="max-w-6xl mx-auto space-y-3">
        {/* Header with logo, title and auth */}
        <header className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">
                Vocabulary Match
              </h1>
              <p className="text-xs text-muted-foreground">Chinese • Pinyin • English</p>
            </div>
          </div>

          {/* Auth button */}
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {user.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="gap-1.5 opacity-50 cursor-not-allowed"
              title="Login temporarily disabled"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Login</span>
            </Button>
          )}
        </header>

        {/* Top bar: File selector + Stats on same line - compact */}
        <div className="flex flex-wrap items-center gap-2">
          <FileSelector
            selectedFile={selectedFile}
            availableFiles={AVAILABLE_FILES}
            onSelectFile={setSelectedFile}
            onUploadFile={handleUploadFile}
          />
          
          <StatsPanel 
            score={score} 
            time={time} 
            accuracy={calculateAccuracy(correctMatches, attempts)}
            onReset={handleReset}
          />
        </div>

        {/* Game settings */}
        <GameSettings
          showPinyin={showPinyin}
          showArabic={showArabic}
          hasArabicData={hasArabicData}
          fourthColumnLabel={fourthColumnHeader}
          shuffleMode={shuffleMode}
          columnVisibility={columnVisibility}
          columnMute={columnMute}
          onShowPinyinChange={setShowPinyin}
          onShowArabicChange={setShowArabic}
          onShuffleModeChange={handleShuffleModeChange}
          onColumnVisibilityChange={handleColumnVisibilityChange}
          onColumnMuteChange={handleColumnMuteChange}
          muteSfx={muteSfx}
          voiceType={voiceType}
          fontSize={fontSize}
          onMuteSfxChange={setMuteSfx}
          onVoiceTypeChange={setVoiceType}
          onFontSizeChange={setFontSize}
          disabled={isLoading}
        />

        {batches.length > 0 && (
          <>
            {/* Progress bar with navigation */}
            <ProgressBar
              currentBatch={currentBatch}
              totalBatches={batches.length}
              completedBatches={completedBatches}
              onSelectBatch={handleSelectBatch}
              matched={matchedPairs}
              total={batches[currentBatch]?.length || 0}
              className="max-w-xl mx-auto"
            />

            <GameBoard
              chineseCards={chineseCards}
              pinyinCards={pinyinCards}
              englishCards={englishCards}
              arabicCards={arabicCards}
              showPinyin={showPinyin}
              showArabic={showArabic}
              columnVisibility={columnVisibility}
              columnMute={columnMute}
              fontSize={fontSize}
              onCardClick={handleCardClick}
              onSpeak={speakWithMute}
              onHint={handleHint}
            />
          </>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        )}

        <CelebrationModal
          isOpen={showCelebration}
          batchNumber={currentBatch + 1}
          score={batchScore}
          time={time}
          accuracy={calculateAccuracy(correctMatches, attempts)}
          isLastBatch={currentBatch === batches.length - 1}
          onNextBatch={handleNextBatch}
          onReplayBatch={() => { setShowCelebration(false); initializeBatch(currentBatch); }}
          onClose={() => setShowCelebration(false)}
        />
      </div>
    </div>
  );
};

export default VocabularyGame;