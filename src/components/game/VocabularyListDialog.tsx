import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VocabularyItem } from '@/utils/excelParser';
import { ColumnConfig, romanizationFor, valueFor } from '@/utils/gameLogic';
import { getLanguage } from '@/utils/languages';
import { cn } from '@/lib/utils';
import { BookOpen, ChevronDown, ChevronRight, Loader2, Search } from 'lucide-react';
import { posAbbrev } from './Card';

interface VocabularyListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  source?: string | null;
  items: VocabularyItem[];
  columns: ColumnConfig[];
  levels: string[];
  currentLevel: string;
  onLoadLevel: (level: string) => Promise<VocabularyItem[]>;
}

const familyOf = (source?: string | null) =>
  (source || 'Vocabulary workbook').replace(/\.(xlsx|xls)$/i, '').split(' · ')[0];

export const VocabularyListDialog: React.FC<VocabularyListDialogProps> = ({
  open,
  onOpenChange,
  source,
  items,
  columns,
  levels,
  currentLevel,
  onLoadLevel,
}) => {
  const initialLevel = currentLevel || levels[0] || 'Vocabulary';
  const [activeLevel, setActiveLevel] = useState(initialLevel);
  const [levelItems, setLevelItems] = useState<Record<string, VocabularyItem[]>>({});
  const [loadingLevel, setLoadingLevel] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const level = currentLevel || levels[0] || 'Vocabulary';
    setActiveLevel(level);
    setLevelItems({ [level]: items });
    setQuery('');
    setExpandedId(null);
  }, [open, source, currentLevel, levels, items]);

  const loadLevel = async (level: string) => {
    setActiveLevel(level);
    setExpandedId(null);
    if (levelItems[level]) return;
    setLoadingLevel(level);
    try {
      const loaded = await onLoadLevel(level);
      setLevelItems(previous => ({ ...previous, [level]: loaded }));
    } finally {
      setLoadingLevel(null);
    }
  };

  const activeItems = useMemo(() => levelItems[activeLevel] || [], [levelItems, activeLevel]);
  const mainLang = columns[0]?.lang || Object.keys(activeItems[0]?.values || {})[0] || 'en';
  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return activeItems;
    return activeItems.filter(item => {
      const texts = [
        item.id,
        item.sourceWordId,
        item.pos,
        item.definition,
        ...Object.values(item.values || {}),
        ...Object.keys(item.values || {}).map(lang => romanizationFor(item, lang) || ''),
      ];
      return texts.some(text => String(text || '').toLocaleLowerCase().includes(normalized));
    });
  }, [activeItems, query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[92vh] w-[calc(100%-1rem)] max-w-6xl flex-col gap-0 overflow-hidden border-border bg-popover p-0 sm:h-[88vh] [&>button]:right-4 [&>button]:top-4 [&>button]:z-30">
        <DialogHeader className="shrink-0 border-b border-border px-4 pb-3 pt-4 pr-14 sm:px-6">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BookOpen className="h-5 w-5 text-primary" />
            {familyOf(source)}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">Explore workbook sheets, definitions, readings, and translations.</p>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
          <aside className="flex shrink-0 gap-1 overflow-x-auto border-b border-border bg-secondary/25 p-2 sm:w-36 sm:flex-col sm:overflow-y-auto sm:border-b-0 sm:border-r">
            {(levels.length ? levels : [initialLevel]).map(level => {
              const count = levelItems[level]?.length;
              return (
                <Button
                  key={level}
                  type="button"
                  variant={activeLevel === level ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => void loadLevel(level)}
                  className="h-9 shrink-0 justify-between gap-3 sm:w-full"
                >
                  <span>{level}</span>
                  <span className="text-[10px] tabular-nums opacity-70">{count ?? '—'}</span>
                </Button>
              );
            })}
          </aside>

          <section className="flex min-w-0 flex-1 flex-col">
            <div className="shrink-0 border-b border-border p-3 sm:p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder={`Search ${activeLevel} in any language…`}
                  className="pl-9"
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {filteredItems.length} of {activeItems.length} entries
              </p>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loadingLevel === activeLevel ? (
                <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" /> Loading {activeLevel}…
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No matching entries.</div>
              ) : (
                <div className="divide-y divide-border/70">
                  {filteredItems.map((item, index) => {
                    const expanded = expandedId === item.id;
                    const mainText = valueFor(item, mainLang) || '—';
                    const mainReading = romanizationFor(item, mainLang);
                    const languageCodes = Object.keys(item.values || {}).filter(lang => item.values[lang]);
                    const previews = languageCodes
                      .filter(lang => lang !== mainLang)
                      .slice(0, 3)
                      .map(lang => item.values[lang]);
                    return (
                      <div key={`${activeLevel}-${item.id}`}>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setExpandedId(expanded ? null : item.id)}
                          className="h-auto w-full justify-start rounded-none px-3 py-3 text-left hover:bg-secondary/40 sm:px-5"
                        >
                          {expanded ? <ChevronDown className="mr-2 h-4 w-4 shrink-0" /> : <ChevronRight className="mr-2 h-4 w-4 shrink-0" />}
                          <span className="mr-3 w-8 shrink-0 font-mono text-[10px] text-muted-foreground">{index + 1}</span>
                          <span className="min-w-0 flex-1">
                            <span className="flex min-w-0 items-center gap-2">
                              <span className={cn('truncate text-base font-semibold text-primary', getLanguage(mainLang).fontClass)} dir={getLanguage(mainLang).rtl ? 'rtl' : 'ltr'}>
                                {mainText}
                              </span>
                              {item.pos && <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{posAbbrev(item.pos)}</span>}
                              {mainReading && <span className="hidden truncate text-xs text-muted-foreground sm:inline">{mainReading}</span>}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                              {item.definition || previews.join(' · ') || 'No definition'}
                            </span>
                          </span>
                        </Button>

                        {expanded && (
                          <div className="border-t border-border/40 bg-secondary/20 px-6 py-4 sm:px-14">
                            <div className="mb-4 grid gap-2 text-sm sm:grid-cols-2">
                              <p><span className="text-muted-foreground">Sense ID:</span> <span className="font-mono text-xs">{item.id}</span></p>
                              {item.sourceWordId && <p><span className="text-muted-foreground">Word ID:</span> <span className="font-mono text-xs">{item.sourceWordId}</span></p>}
                              {item.definition && <p className="sm:col-span-2"><span className="text-muted-foreground">Definition:</span> {item.definition}</p>}
                            </div>
                            <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                              {languageCodes.map(lang => {
                                const language = getLanguage(lang);
                                const reading = romanizationFor(item, lang);
                                return (
                                  <div key={lang} className="min-w-0 border-l-2 border-primary/35 pl-3">
                                    <p className="text-[10px] font-semibold uppercase text-muted-foreground">{language.name}</p>
                                    <p className={cn('break-words text-sm text-foreground', language.fontClass)} dir={language.rtl ? 'rtl' : 'ltr'}>{item.values[lang]}</p>
                                    {reading && <p className="break-words text-xs text-muted-foreground">{reading}</p>}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VocabularyListDialog;