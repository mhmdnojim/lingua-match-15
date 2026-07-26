import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { VocabularyItem } from '@/utils/excelParser';
import { ColumnConfig } from '@/utils/gameLogic';
import { getLanguage } from '@/utils/languages';
import { cn } from '@/lib/utils';
import { RefreshCw, Sparkles } from 'lucide-react';

interface WordEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: VocabularyItem[];
  columns: ColumnConfig[];
  mainLang: string;
  onEditValue: (vocabId: string, lang: string, value: string) => void;
  onRegenerate: (vocabId: string, lang: string, instruction?: string) => Promise<void>;
  onRegenerateAll: (instruction?: string) => Promise<void>;
}

export const WordEditorDialog: React.FC<WordEditorDialogProps> = ({
  open,
  onOpenChange,
  items,
  columns,
  mainLang,
  onEditValue,
  onRegenerate,
  onRegenerateAll,
}) => {
  const [instruction, setInstruction] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const handleRegenerate = async (vocabId: string, lang: string) => {
    setBusy(`${vocabId}-${lang}`);
    try {
      await onRegenerate(vocabId, lang, instruction.trim() || undefined);
    } finally {
      setBusy(null);
    }
  };

  const handleRegenerateAll = async () => {
    setBusy('all');
    try {
      await onRegenerateAll(instruction.trim() || undefined);
    } finally {
      setBusy(null);
    }
  };

  const targetColumns = columns.filter(c => c.lang !== mainLang);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Words in this round</DialogTitle>
          <DialogDescription>
            Fix a translation by typing over it, or regenerate it with AI. Optional guidance below is applied to
            regenerations.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={instruction}
            onChange={e => setInstruction(e.target.value)}
            placeholder="Optional guidance, e.g. 'single word', 'more formal', 'everyday spoken form'"
            className="flex-1 min-w-[240px]"
          />
          <Button onClick={handleRegenerateAll} disabled={busy !== null} className="gap-1.5">
            <Sparkles className="w-4 h-4" />
            Regenerate all
          </Button>
        </div>

        <div className="space-y-4">
          {items.map(item => (
            <div key={item.id} className="rounded-lg border border-border bg-secondary/30 p-3 space-y-2">
              <div className="flex items-baseline gap-2">
                <span
                  dir={getLanguage(mainLang).rtl ? 'rtl' : 'ltr'}
                  className={cn('text-xl font-semibold text-foreground', getLanguage(mainLang).fontClass)}
                >
                  {item.values[mainLang]}
                </span>
                <span className="text-xs text-muted-foreground uppercase">{getLanguage(mainLang).name}</span>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {targetColumns.map(column => {
                  const language = getLanguage(column.lang);
                  const key = `${item.id}-${column.lang}`;
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{language.name}</span>
                        {item.edited?.[column.lang] && <span className="text-warning">edited</span>}
                      </div>
                      <div className="flex items-center gap-1">
                        <Input
                          value={item.values[column.lang] || ''}
                          dir={language.rtl ? 'rtl' : 'ltr'}
                          onChange={e => onEditValue(item.id, column.lang, e.target.value)}
                          placeholder="No translation yet"
                          className={cn('text-sm', language.fontClass)}
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          title="Regenerate this translation"
                          disabled={busy !== null}
                          onClick={() => handleRegenerate(item.id, column.lang)}
                        >
                          <RefreshCw className={cn('w-4 h-4', busy === key && 'animate-spin')} />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WordEditorDialog;
