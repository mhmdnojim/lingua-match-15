import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { cn } from '@/lib/utils';
import {
  VocabularyItem,
  SheetData,
  ColumnMapping,
  autoMapping,
  buildVocabulary,
  fetchExcelFromUrl,
  parseExcelFile,
  createBatches,
} from '@/utils/excelParser';
import {
  GameCard,
  ColumnConfig,
  createColumnCards,
  sortVocabulary,
  calculateAccuracy,
} from '@/utils/gameLogic';
import {
  saveProgress,
  loadProgress,
  clearProgress,
  saveVocabulary,
  loadVocabularyCache,
  saveUiState,
  loadUiState,
  DEFAULT_COLUMNS,
  VoiceType,
  FontSize,
} from '@/utils/storage';
import { getLanguage } from '@/utils/languages';
import { exportVocabularyToExcel } from '@/utils/exportExcel';
import { translateWords } from '@/utils/translate';
import { fetchCloudSet, saveCloudSet, filledCount } from '@/utils/cloudVocabulary';
import { useAudio } from '@/hooks/useAudio';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import GameBoard from './GameBoard';
import StatsPanel from './StatsPanel';
import ProgressBar from './ProgressBar';
import FileSelector from './FileSelector';
import GameSettings from './GameSettings';
import CelebrationModal from './CelebrationModal';
import LanguageColumnsDialog from './LanguageColumnsDialog';
import WordEditorDialog from './WordEditorDialog';
import ImportMappingDialog from './ImportMappingDialog';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { BookOpen, LogIn, LogOut, Loader2, Cloud, CloudOff, CloudUpload, SlidersHorizontal, ChevronUp } from 'lucide-react';
import { sampleVocabulary } from '@/data/sampleVocabulary';


const AVAILABLE_FILES = ['sample-vocabulary.xlsx'];
const BATCH_SIZE = 5;

export interface VocabularyGameProps {
  dataSource?: string;
  batchSize?: number;
  onComplete?: () => void;
  className?: string;
}

export const VocabularyGame: React.FC<VocabularyGameProps> = ({
  dataSource,
  batchSize = BATCH_SIZE,
  onComplete,
  className,
}) => {
  const { toast } = useToast();
  const savedProgress = loadProgress();
  const cached = loadVocabularyCache();
  const savedUi = loadUiState();

  const [user, setUser] = useState<any>(null);

  const [columns, setColumns] = useState<ColumnConfig[]>(savedProgress.columns?.length ? savedProgress.columns : DEFAULT_COLUMNS);
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>(cached?.items?.length ? cached.items : sampleVocabulary);
  const [batches, setBatches] = useState<VocabularyItem[][]>([]);
  const [currentBatch, setCurrentBatch] = useState(savedProgress.currentBatch);
  const [completedBatches, setCompletedBatches] = useState<number[]>(savedProgress.completedBatches);
  const [shuffleMode, setShuffleMode] = useState(savedProgress.shuffleMode);
  const [muteSfx, setMuteSfx] = useState(savedProgress.muteSfx);
  const [voiceType, setVoiceType] = useState<VoiceType>(savedProgress.voiceType);
  const [fontSize, setFontSize] = useState<FontSize>(savedProgress.fontSize);
  const [selectedFile, setSelectedFile] = useState<string | null>(dataSource || savedProgress.selectedFile);
  const [cards, setCards] = useState<Record<string, GameCard[]>>({});
  const [selectedCards, setSelectedCards] = useState<GameCard[]>([]);
  const [score, setScore] = useState(savedProgress.score);
  const [time, setTime] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [correctMatches, setCorrectMatches] = useState(0);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [batchScore, setBatchScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translateProgress, setTranslateProgress] = useState<{
    lang: string;
    done: number;
    total: number;
    words: string[];
  } | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [languagesOpen, setLanguagesOpen] = useState(savedUi.languagesOpen);
  const [wordEditorOpen, setWordEditorOpen] = useState(savedUi.wordEditorOpen);
  const [settingsOpen, setSettingsOpen] = useState(savedUi.settingsOpen);
  const [pendingSheet, setPendingSheet] = useState<SheetData | null>(null);
  const [cloudStatus, setCloudStatus] = useState<'off' | 'saving' | 'saved' | 'error'>('off');

  const navigate = useNavigate();
  const mainLang = columns[0]?.lang || 'zh';
  const { speak, playSuccess, playError, playCelebration } = useAudio({ muteVoice: false, muteSfx, voiceType });

  const cloudSource = selectedFile || 'upload';
  const userRef = useRef<any>(null);
  userRef.current = user;
  const columnsRef = useRef<ColumnConfig[]>(columns);
  columnsRef.current = columns;
  const cloudTimer = useRef<number | null>(null);

  // Auth state listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Save words locally and — when signed in — to the account so the generated
   * translations come back on any other device.
   */
  const persistVocabulary = useCallback(
    (items: VocabularyItem[], main: string) => {
      saveVocabulary({ items, mainLang: main, source: cloudSource });
      if (!userRef.current) return;
      if (cloudTimer.current) window.clearTimeout(cloudTimer.current);
      setCloudStatus('saving');
      cloudTimer.current = window.setTimeout(async () => {
        const ok = await saveCloudSet({ source: cloudSource, mainLang: main, columns: columnsRef.current, items });
        setCloudStatus(ok ? 'saved' : 'error');
      }, 1200);
    },
    [cloudSource],
  );


  // Timer
  useEffect(() => {
    if (!gameStarted || showCelebration) return;
    const interval = setInterval(() => setTime(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, [gameStarted, showCelebration]);

  // Persist settings
  useEffect(() => {
    saveProgress({ muteSfx, voiceType, fontSize, columns, shuffleMode });
  }, [muteSfx, voiceType, fontSize, columns, shuffleMode]);

  // Remember which dialogs were open
  useEffect(() => {
    saveUiState({ languagesOpen, wordEditorOpen, settingsOpen });
  }, [languagesOpen, wordEditorOpen, settingsOpen]);

  // Rebuild batches whenever vocabulary / ordering / main language changes
  useEffect(() => {
    if (vocabulary.length === 0) {
      setBatches([]);
      return;
    }
    const ordered = shuffleMode ? vocabulary : sortVocabulary(vocabulary, mainLang);
    setBatches(createBatches(ordered, batchSize));
  }, [vocabulary, shuffleMode, mainLang, batchSize]);

  /** Fill in missing translations for the given items using AI */
  const translateMissing = useCallback(
    async (items: VocabularyItem[], activeColumns: ColumnConfig[], source: string, instruction?: string, force = false) => {
      if (items.length === 0 || activeColumns.length === 0) return;

      // How many items already have text for a language
      const filled = (lang: string) => items.filter(i => (i.values[lang] || '').trim()).length;

      // If the chosen main language has no data yet (user just switched it), translate
      // *from* whichever language does have data, so the main column gets generated too.
      let effectiveSource = source;
      if (filled(source) === 0) {
        const candidates = new Set<string>();
        items.forEach(i => Object.keys(i.values).forEach(k => candidates.add(k)));
        const best = Array.from(candidates)
          .filter(l => l !== source)
          .sort((a, b) => filled(b) - filled(a))[0];
        if (!best || filled(best) === 0) return;
        effectiveSource = best;
      }

      const targets = activeColumns.filter(c => c.lang !== effectiveSource);
      if (targets.length === 0) return;

      setIsTranslating(true);

      // Total work = every word that needs a translation across all target columns
      const pendingByColumn = new Map<string, VocabularyItem[]>();
      for (const column of targets) {
        pendingByColumn.set(
          column.lang,
          items.filter(item => {
            const has = (item.values[column.lang] || '').trim().length > 0;
            const isEdited = item.edited?.[column.lang];
            return force ? !isEdited || instruction !== undefined : !has;
          }),
        );
      }
      const totalWords = Array.from(pendingByColumn.values()).reduce((sum, list) => sum + list.length, 0);
      let doneWords = 0;
      setTranslateProgress({ lang: targets[0].lang, done: 0, total: totalWords, words: [] });

      try {
        for (const column of targets) {
          const pending = pendingByColumn.get(column.lang) || [];
          if (pending.length === 0) continue;

          // Translate in chunks so large datasets (all batches) stay within request limits
          const CHUNK = 25;
          for (let start = 0; start < pending.length; start += CHUNK) {
            const chunk = pending.slice(start, start + CHUNK);
            const words = chunk.map(item => item.values[effectiveSource] || '');
            setTranslateProgress({
              lang: column.lang,
              done: doneWords,
              total: totalWords,
              words: words.filter(Boolean).slice(0, 5),
            });
            const results = await translateWords({ sourceLang: effectiveSource, targetLang: column.lang, words, instruction });

            setVocabulary(prev => {
              const next = prev.map(item => {
                const index = chunk.findIndex(p => p.id === item.id);
                if (index === -1) return item;
                const value = results[index];
                if (!value) return item;
                return { ...item, values: { ...item.values, [column.lang]: value } };
              });
              persistVocabulary(next, source);
              return next;
            });

            doneWords += chunk.length;
            setTranslateProgress({
              lang: column.lang,
              done: doneWords,
              total: totalWords,
              words: words.filter(Boolean).slice(0, 5),
            });
          }
        }
      } catch (error) {
        toast({
          title: 'Translation failed',
          description: error instanceof Error ? error.message : 'Could not generate translations',
          variant: 'destructive',
        });
      } finally {
        setIsTranslating(false);
        setTranslateProgress(null);
      }
    },
    [persistVocabulary, toast],
  );

  // Auto-translate the current batch when a configured column has no data yet
  const autoTranslatedRef = useRef<string>('');
  useEffect(() => {
    const batch = batches[currentBatch];
    if (!batch || isTranslating) return;

    const missing = batch.some(item =>
      columns.some(c => !(item.values[c.lang] || '').trim()),
    );

    const key = `${currentBatch}-${columns.map(c => c.lang).join(',')}-${batch.map(i => i.id).join(',')}`;
    if (!missing || autoTranslatedRef.current === key) return;

    autoTranslatedRef.current = key;
    translateMissing(batch, columns, mainLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batches, currentBatch, columns, mainLang]);

  // Pull the saved set from the account (or seed it) when signed in
  const cloudPulledRef = useRef<string>('');
  useEffect(() => {
    if (!user) {
      setCloudStatus('off');
      cloudPulledRef.current = '';
      return;
    }
    const key = `${user.id}-${cloudSource}`;
    if (cloudPulledRef.current === key) return;
    cloudPulledRef.current = key;

    (async () => {
      setCloudStatus('saving');
      const remote = await fetchCloudSet(cloudSource);

      if (!remote || remote.items.length === 0) {
        if (vocabulary.length > 0) {
          const ok = await saveCloudSet({ source: cloudSource, mainLang, columns, items: vocabulary });
          setCloudStatus(ok ? 'saved' : 'error');
        } else {
          setCloudStatus('saved');
        }
        return;
      }

      if (filledCount(remote.items) > filledCount(vocabulary)) {
        setVocabulary(remote.items);
        if (remote.columns.length >= 2) setColumns(remote.columns);
        saveVocabulary({ items: remote.items, mainLang: remote.mainLang, source: cloudSource });
        autoTranslatedRef.current = '';
        toast({
          title: 'Restored from your account',
          description: `${remote.items.length} words with their saved translations were loaded.`,
        });
      }
      setCloudStatus('saved');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, cloudSource]);


  const initializeBatch = useCallback(
    (batchIndex: number) => {
      const batch = batches[batchIndex];
      if (!batch) return;
      setCards(createColumnCards(batch, columns, shuffleMode));
      setSelectedCards([]);
      setMatchedPairs(0);
      setTime(0);
      setAttempts(0);
      setCorrectMatches(0);
      setBatchScore(0);
      setGameStarted(true);
    },
    [batches, columns, shuffleMode],
  );

  useEffect(() => {
    if (batches.length > 0) initializeBatch(currentBatch);
  }, [batches, currentBatch, initializeBatch]);

  // Load a hosted file
  const loadVocabulary = useCallback(
    async (fileName: string) => {
      setIsLoading(true);
      const result = await fetchExcelFromUrl(`/datasets/${fileName}`);
      setIsLoading(false);
      if (!result.success) {
        toast({ title: 'Error', description: result.error, variant: 'destructive' });
        return;
      }
      handleSheetReady(result);
    },
    [toast],
  );

  const skipInitialLoadRef = useRef(Boolean(cached?.items?.length));
  useEffect(() => {
    if (!selectedFile) return;
    saveProgress({ selectedFile });
    // On a fresh app open, keep the words that were already saved instead of
    // re-running the import flow for the remembered file.
    if (skipInitialLoadRef.current) {
      skipInitialLoadRef.current = false;
      return;
    }
    loadVocabulary(selectedFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFile]);

  const handleUploadFile = async (file: File) => {
    setIsLoading(true);
    const result = await parseExcelFile(file);
    setIsLoading(false);
    if (!result.success) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' });
      return;
    }
    handleSheetReady(result);
  };

  /** Import straight away when the first column's language is recognised */
  const handleSheetReady = (sheet: SheetData) => {
    const auto = autoMapping(sheet);
    if (auto) {
      applyMapping(sheet, auto);
      return;
    }
    setPendingSheet(sheet);
  };

  const handleConfirmMapping = (mapping: ColumnMapping) => {
    if (!pendingSheet) return;
    applyMapping(pendingSheet, mapping);
  };

  const applyMapping = (sheet: SheetData, mapping: ColumnMapping) => {
    const mappedLangs = Object.entries(mapping)
      .filter(([, lang]) => lang && lang !== 'ignore')
      .map(([, lang]) => lang);
    const newMain = mappedLangs[0];

    // Keep configured columns, put the file's main language first, then existing extras
    const extras = columns.map(c => c.lang).filter(lang => lang !== newMain);
    const langs = [newMain, ...Array.from(new Set([...mappedLangs.slice(1), ...extras]))].slice(0, 4);
    const nextColumns: ColumnConfig[] = langs.map((lang, index) => {
      const existing = columns.find(c => c.lang === lang);
      return existing
        ? { ...existing, showRomanization: index === 0 ? existing.showRomanization : false }
        : { lang, visible: true, muted: false, showRomanization: index === 0 };
    });

    const items = buildVocabulary(sheet, mapping, newMain);

    if (items.length === 0) {
      toast({ title: 'Nothing to import', description: 'No rows had a value in the main language', variant: 'destructive' });
      return;
    }

    setColumns(nextColumns);
    setVocabulary(items);
    persistVocabulary(items, newMain);
    setCurrentBatch(0);
    setScore(0);
    setCompletedBatches([]);
    saveProgress({ currentBatch: 0, score: 0, completedBatches: [], columns: nextColumns });
    setPendingSheet(null);
    autoTranslatedRef.current = '';
    toast({
      title: 'File imported',
      description: `${items.length} words loaded — main language: ${getLanguage(newMain).native}. Missing columns are generated with AI.`,
    });
  };

  const handleColumnsChange = (next: ColumnConfig[]) => {
    setColumns(next);
    autoTranslatedRef.current = '';
  };

  const handleColumnVisibilityChange = useCallback((lang: string, visible: boolean) => {
    setColumns(prev => prev.map(c => (c.lang === lang ? { ...c, visible } : c)));
  }, []);

  const handleColumnMuteChange = useCallback((lang: string, muted: boolean) => {
    setColumns(prev => prev.map(c => (c.lang === lang ? { ...c, muted } : c)));
  }, []);

  const handleColumnRomanizationChange = useCallback((lang: string, showRomanization: boolean) => {
    setColumns(prev => prev.map(c => (c.lang === lang ? { ...c, showRomanization } : c)));
  }, []);

  const handleSpeak = useCallback(
    (card: GameCard) => {
      const column = columns.find(c => c.lang === card.lang);
      if (column?.muted) return;
      speak(card.content, card.lang);
    },
    [columns, speak],
  );

  const handleHint = useCallback(
    (card: GameCard) => {
      const vocabId = card.vocabId;
      const highlighted: GameCard[] = [];
      setCards(prev => {
        const next: Record<string, GameCard[]> = {};
        Object.entries(prev).forEach(([lang, list]) => {
          next[lang] = list.map(c => {
            if (c.vocabId === vocabId && !c.isMatched) {
              const updated = { ...c, isSelected: true };
              highlighted.push(updated);
              return updated;
            }
            return c;
          });
        });
        return next;
      });
      setSelectedCards(highlighted);
      toast({ title: 'Hint used', description: 'Matching cards highlighted! -5 points' });
      setScore(s => Math.max(0, s - 5));
      setBatchScore(s => Math.max(0, s - 5));
    },
    [toast],
  );

  const updateCardSelection = (cardId: string, isSelected: boolean) => {
    setCards(prev => {
      const next: Record<string, GameCard[]> = {};
      Object.entries(prev).forEach(([lang, list]) => {
        next[lang] = list.map(c => (c.id === cardId ? { ...c, isSelected } : c));
      });
      return next;
    });
  };

  const handleCardClick = useCallback(
    (card: GameCard) => {
      if (card.isMatched || card.isError) return;
      if (selectedCards.find(c => c.id === card.id)) {
        setSelectedCards(selectedCards.filter(c => c.id !== card.id));
        updateCardSelection(card.id, false);
        return;
      }
      const sameColumn = selectedCards.find(c => c.lang === card.lang);
      if (sameColumn) {
        updateCardSelection(sameColumn.id, false);
        setSelectedCards(prev => [...prev.filter(c => c.lang !== card.lang), card]);
      } else {
        setSelectedCards(prev => [...prev, card]);
      }
      updateCardSelection(card.id, true);
    },
    [selectedCards],
  );

  const requiredSelections = useMemo(
    () => columns.filter(c => c.visible && (cards[c.lang]?.length ?? 0) > 0).length,
    [columns, cards],
  );

  // Match checking
  useEffect(() => {
    if (requiredSelections < 2 || selectedCards.length !== requiredSelections) return;

    setAttempts(a => a + 1);
    const vocabIds = selectedCards.map(c => c.vocabId);
    const isMatch = vocabIds.every(id => id === vocabIds[0]);

    const mapAll = (updater: (card: GameCard) => GameCard) => {
      setCards(prev => {
        const next: Record<string, GameCard[]> = {};
        Object.entries(prev).forEach(([lang, list]) => {
          next[lang] = list.map(updater);
        });
        return next;
      });
    };

    if (isMatch) {
      playSuccess();
      setCorrectMatches(c => c + 1);
      setScore(s => s + 10);
      setBatchScore(s => s + 10);
      setMatchedPairs(m => m + 1);
      mapAll(c => (selectedCards.some(s => s.id === c.id) ? { ...c, isMatched: true, isSelected: false } : c));
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
      mapAll(c => (selectedCards.some(s => s.id === c.id) ? { ...c, isError: true } : c));
      setTimeout(() => {
        mapAll(c => ({ ...c, isError: false, isSelected: false }));
        setSelectedCards([]);
      }, 500);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCards, requiredSelections]);

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

  // Word editor handlers
  const currentItems = batches[currentBatch] || [];

  const handleEditValue = (vocabId: string, lang: string, value: string) => {
    setVocabulary(prev => {
      const next = prev.map(item =>
        item.id === vocabId
          ? { ...item, values: { ...item.values, [lang]: value }, edited: { ...item.edited, [lang]: true } }
          : item,
      );
      persistVocabulary(next, mainLang);
      return next;
    });
  };

  const handleRegenerateOne = async (vocabId: string, lang: string, instruction?: string) => {
    const item = vocabulary.find(i => i.id === vocabId);
    if (!item) return;
    try {
      const [result] = await translateWords({
        sourceLang: mainLang,
        targetLang: lang,
        words: [item.values[mainLang] || ''],
        instruction,
      });
      if (result) {
        setVocabulary(prev => {
          const next = prev.map(i =>
            i.id === vocabId ? { ...i, values: { ...i.values, [lang]: result }, edited: { ...i.edited, [lang]: false } } : i,
          );
          persistVocabulary(next, mainLang);
          return next;
        });
      }
    } catch (error) {
      toast({
        title: 'Regeneration failed',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  /** Regenerate every target column for a single word */
  const handleRegenerateWord = async (vocabId: string, instruction?: string) => {
    const item = vocabulary.find(i => i.id === vocabId);
    if (!item) return;
    await translateMissing([item], columns, mainLang, instruction, true);
  };

  /** Regenerate one column for every word in the current round */
  const handleRegenerateColumn = async (lang: string, instruction?: string) => {
    const column = columns.find(c => c.lang === lang);
    if (!column || currentItems.length === 0) return;
    await translateMissing(currentItems, [columns[0], column], mainLang, instruction, true);
  };

  const handleRegenerateAll = async (instruction?: string) => {
    // Regenerate across the entire dataset (all batches), not just the current batch
    await translateMissing(vocabulary, columns, mainLang, instruction, true);
    toast({
      title: 'Translations regenerated',
      description: `Updated ${vocabulary.length} words across all ${batches.length} batches.`,
    });
  };

  const handleExportExcel = () => {
    exportVocabularyToExcel(vocabulary, columns, mainLang, selectedFile || 'vocabulary');
    toast({
      title: 'Excel exported',
      description: `${vocabulary.length} words with all ${columns.length} language columns.`,
    });
  };


  const headerSubtitle = columns.map(c => getLanguage(c.lang).native).join(' • ');

  return (
    <div className={cn('min-h-screen bg-background p-4 md:p-6', className)}>
      <div className="max-w-6xl mx-auto space-y-3">
        <header className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-lg">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Vocabulary Match</h1>
              <p className="text-xs text-muted-foreground">{headerSubtitle}</p>
            </div>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              disabled={isLoading}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                settingsOpen
                  ? 'bg-primary border-primary text-primary-foreground'
                  : 'bg-secondary border-border text-muted-foreground hover:text-foreground',
                isLoading && 'opacity-50 cursor-not-allowed',
              )}
              title={settingsOpen ? 'Hide options' : 'Show options'}
            >
              <SlidersHorizontal className="w-4 h-4 shrink-0" />
              <span className="hidden sm:inline">Options</span>
              <ChevronUp className={cn('w-3.5 h-3.5 transition-transform', !settingsOpen && 'rotate-180')} />
            </button>
            <StatsPanel
              score={score}
              time={time}
              accuracy={calculateAccuracy(correctMatches, attempts)}
              onReset={handleReset}
            />
          </div>


          {user ? (
            <div className="flex items-center gap-2">
              <span
                className="flex items-center gap-1.5 text-xs text-muted-foreground"
                title={
                  cloudStatus === 'error'
                    ? 'Could not sync with your account'
                    : cloudStatus === 'saving'
                      ? 'Syncing words and translations…'
                      : 'Words and translations saved to your account'
                }
              >
                {cloudStatus === 'saving' ? (
                  <CloudUpload className="w-4 h-4 animate-pulse text-primary" />
                ) : cloudStatus === 'error' ? (
                  <CloudOff className="w-4 h-4 text-destructive" />
                ) : (
                  <Cloud className="w-4 h-4 text-primary" />
                )}
                <span className="hidden sm:inline">
                  {cloudStatus === 'saving' ? 'Syncing…' : cloudStatus === 'error' ? 'Sync failed' : 'Synced'}
                </span>
              </span>
              <span className="text-xs text-muted-foreground hidden md:inline">{user.email}</span>
              <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5">
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/auth')}
              className="gap-1.5"
              title="Sign in to save your words and translations to your account"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Sign in to sync</span>
            </Button>
          )}

        </header>

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

        <GameSettings
          columns={columns}
          shuffleMode={shuffleMode}
          onShuffleModeChange={setShuffleMode}
          onColumnVisibilityChange={handleColumnVisibilityChange}
          onColumnMuteChange={handleColumnMuteChange}
          onColumnRomanizationChange={handleColumnRomanizationChange}
          onOpenLanguages={() => setLanguagesOpen(true)}
          onOpenWordEditor={() => setWordEditorOpen(true)}
          muteSfx={muteSfx}
          voiceType={voiceType}
          fontSize={fontSize}
          onMuteSfxChange={setMuteSfx}
          onVoiceTypeChange={setVoiceType}
          onFontSizeChange={setFontSize}
          disabled={isLoading}
          settingsOpen={settingsOpen}
          onSettingsOpenChange={setSettingsOpen}
          showToggle={false}

        />

        {isTranslating && (
          <div className="max-w-xl mx-auto rounded-lg border border-border bg-card p-3 space-y-2">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 text-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                {translateProgress
                  ? `Translating to ${getLanguage(translateProgress.lang).native}…`
                  : 'Generating translations…'}
              </span>
              {translateProgress && translateProgress.total > 0 && (
                <span className="text-muted-foreground tabular-nums">
                  {translateProgress.done}/{translateProgress.total} words
                </span>
              )}
            </div>

            <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width:
                    translateProgress && translateProgress.total > 0
                      ? `${Math.round((translateProgress.done / translateProgress.total) * 100)}%`
                      : '10%',
                }}
              />
            </div>

            {translateProgress?.words.length ? (
              <p className="text-xs text-muted-foreground truncate">
                Now updating: {translateProgress.words.join(' · ')}
              </p>
            ) : null}
          </div>
        )}

        {batches.length > 0 && (
          <>
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
              columns={columns}
              cards={cards}
              loadingLangs={isTranslating ? columns.map(c => c.lang) : []}
              fontSize={fontSize}
              onCardClick={handleCardClick}
              onSpeak={handleSpeak}
              onHint={handleHint}
            />
          </>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          </div>
        )}

        <LanguageColumnsDialog
          open={languagesOpen}
          columns={columns}
          onOpenChange={setLanguagesOpen}
          onChange={handleColumnsChange}
        />

        <WordEditorDialog
          open={wordEditorOpen}
          onOpenChange={setWordEditorOpen}
          items={currentItems}
          columns={columns}
          mainLang={mainLang}
          onEditValue={handleEditValue}
          onRegenerate={handleRegenerateOne}
          onRegenerateAll={handleRegenerateAll}
          onRegenerateWord={handleRegenerateWord}
          onRegenerateColumn={handleRegenerateColumn}
          onExportExcel={handleExportExcel}

        />

        <ImportMappingDialog
          open={pendingSheet !== null}
          sheet={pendingSheet}
          onOpenChange={open => !open && setPendingSheet(null)}
          onConfirm={handleConfirmMapping}
        />

        <CelebrationModal
          isOpen={showCelebration}
          batchNumber={currentBatch + 1}
          score={batchScore}
          time={time}
          accuracy={calculateAccuracy(correctMatches, attempts)}
          isLastBatch={currentBatch === batches.length - 1}
          onNextBatch={handleNextBatch}
          onReplayBatch={() => {
            setShowCelebration(false);
            initializeBatch(currentBatch);
          }}
          onClose={() => setShowCelebration(false)}
        />
      </div>
    </div>
  );
};

export default VocabularyGame;
