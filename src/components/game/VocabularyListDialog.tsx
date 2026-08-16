import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VocabularyItem } from '@/utils/excelParser';
import { ColumnConfig, valueFor, romanizationFor } from '@/utils/gameLogic';
import { getLanguage } from '@/utils/languages';
import { Search, Type, List, ArrowUpAZ, ArrowDownAZ, ListOrdered } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VocabularyListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: VocabularyItem[];
  columns: ColumnConfig[];
}

type SortMode = 'file' | 'asc' | 'desc';

const SORT_MODES: { mode: SortMode; label: string; Icon: typeof ListOrdered }[] = [
  { mode: 'file', label: 'File order', Icon: ListOrdered },
  { mode: 'asc', label: 'A → Z', Icon: ArrowUpAZ },
  { mode: 'desc', label: 'Z → A', Icon: ArrowDownAZ },
];

// 6 cycling font steps; after the largest it wraps back to the smallest
const FONT_STEPS = [
  { row: 'h-9', value: 'text-[11px]', detail: 'text-[10px]' },
  { row: 'h-10', value: 'text-xs', detail: 'text-[11px]' },
  { row: 'h-11', value: 'text-sm', detail: 'text-xs' },
  { row: 'h-12', value: 'text-base', detail: 'text-sm' },
  { row: 'h-14', value: 'text-lg', detail: 'text-base' },
  { row: 'h-16', value: 'text-xl', detail: 'text-lg' },
];

export const VocabularyListDialog: React.FC<VocabularyListDialogProps> = ({
  open,
  onOpenChange,
  items,
  columns,
}) => {
  const [query, setQuery] = useState('');
  const [fontStep, setFontStep] = useState(2);
  const [sortMode, setSortMode] = useState<SortMode>('file');

  const visibleColumns = useMemo(() => columns.filter(c => c.visible), [columns]);
  const mainColumn = visibleColumns[0] || columns[0];
  const otherColumns = useMemo(
    () => visibleColumns.filter(c => c.lang !== mainColumn?.lang),
    [visibleColumns, mainColumn],
  );
  const listColumns = mainColumn ? [mainColumn, ...otherColumns] : [];

  const filteredItems = useMemo(() => {
    const q = query.toLowerCase().trim();
    const base = !q
      ? items
      : items.filter(item =>
          listColumns.some(column => {
            const value = valueFor(item, column.lang).toLowerCase();
            const romanization = (romanizationFor(item, column.lang) || '').toLowerCase();
            return value.includes(q) || romanization.includes(q);
          }),
        );

    if (sortMode === 'file') return base;
    const lang = mainColumn?.lang || '';
    const sorted = [...base].sort((a, b) =>
      valueFor(a, lang).localeCompare(valueFor(b, lang), undefined, { sensitivity: 'base', numeric: true }),
    );
    return sortMode === 'desc' ? sorted.reverse() : sorted;
  }, [items, listColumns, query, sortMode, mainColumn]);

  const sizes = FONT_STEPS[fontStep];
  const activeSort = SORT_MODES.find(s => s.mode === sortMode)!;
  const SortIcon = activeSort.Icon;


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[88vh] w-[calc(100%-1.5rem)] max-w-4xl flex-col gap-0 overflow-hidden rounded-lg border-border bg-popover p-0 shadow-2xl [&>button]:right-5 [&>button]:top-5 [&>button]:z-20 [&>button]:rounded-full [&>button]:p-2">
        <DialogHeader className="shrink-0 border-b border-border bg-popover px-5 pb-4 pt-5 pr-14 sm:px-7 sm:pb-5 sm:pt-6 sm:pr-16">
          <div className="space-y-1">
            <DialogTitle className="flex items-center gap-2 font-mono text-xl font-semibold sm:text-2xl">
              <List className="h-5 w-5 text-primary" />
              Vocabs
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {filteredItems.length} of {items.length} word{items.length === 1 ? '' : 's'}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-4">
            <div className="relative flex-1 min-w-[12rem]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Find a word…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="h-10 rounded-md border-border bg-secondary/50 pl-9 text-sm"
              />
            </div>

            <div className="flex h-10 shrink-0 items-center gap-1 rounded-md border border-border bg-secondary/50 px-1.5">
              <Type className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
              {(['small', 'medium', 'large'] as FontSize[]).map(size => (
                <Button
                  key={size}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setFontSize(size)}
                  className={cn(
                    'h-7 min-w-7 rounded px-2 font-mono font-medium',
                    fontSize === size
                      ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                    size === 'small' && 'text-[10px]',
                    size === 'medium' && 'text-xs',
                    size === 'large' && 'text-sm',
                  )}
                  aria-label={`Set font size ${size}`}
                >
                  A
                </Button>
              ))}
            </div>
          </div>
        </DialogHeader>

        <div className="grid shrink-0 grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1.4fr)] border-b border-border bg-secondary/40 px-4 py-2 font-mono text-[10px] font-semibold uppercase text-muted-foreground sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1.5fr)] sm:px-7">
          <span>#</span>
          <span className="truncate">{mainColumn ? getLanguage(mainColumn.lang).name : 'Main'}</span>
          <span className="truncate pl-4">Translations</span>
        </div>

        <div className="h-[min(58vh,34rem)] min-h-0 overflow-y-auto overscroll-contain [scrollbar-color:hsl(var(--border))_transparent] [scrollbar-width:thin]" data-testid="vocabs-scroll-region">
          {filteredItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
              <Search className="mb-3 h-8 w-8 opacity-40" />
              <p className="text-sm">No words match your search.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/60 px-4 sm:px-7">
              {filteredItems.map((item, index) => {
                const mainValue = valueFor(item, mainColumn?.lang || '');
                const translations = otherColumns.map(column => {
                  const value = valueFor(item, column.lang) || '—';
                  const romanization = column.showRomanization ? romanizationFor(item, column.lang) : undefined;
                  return {
                    lang: getLanguage(column.lang),
                    text: romanization ? `${value} (${romanization})` : value,
                  };
                });

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'group grid grid-cols-[2.25rem_minmax(0,1fr)_minmax(0,1.4fr)] items-center transition-colors hover:bg-secondary/40 sm:grid-cols-[3rem_minmax(0,1fr)_minmax(0,1.5fr)]',
                      sizes.row,
                    )}
                  >
                    <span className="font-mono text-[10px] tabular-nums text-muted-foreground">{index + 1}</span>
                    <span className={cn('truncate pr-3 font-semibold text-primary', sizes.value)} title={mainValue}>
                      {mainValue || '—'}
                    </span>
                    <div className={cn('flex min-w-0 items-center gap-3 overflow-hidden border-l border-border/50 pl-4 text-foreground', sizes.detail)}>
                      {translations.length > 0 ? translations.map(({ lang, text }) => (
                        <span key={lang.code} className="min-w-0 truncate" dir={lang.rtl ? 'rtl' : 'ltr'} title={`${lang.name}: ${text}`}>
                          <span className="mr-1 font-mono text-[9px] uppercase text-muted-foreground">{lang.short}</span>
                          {text}
                        </span>
                      )) : <span className="text-muted-foreground">No visible translations</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-center border-t border-border bg-secondary/30 px-5 py-3">
          <p className="font-mono text-[10px] uppercase text-muted-foreground">
            Showing {filteredItems.length} word{filteredItems.length === 1 ? '' : 's'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default VocabularyListDialog;
