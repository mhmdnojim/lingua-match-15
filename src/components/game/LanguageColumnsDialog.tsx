import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ColumnConfig } from '@/utils/gameLogic';
import { PICKABLE_LANGUAGES, MAIN_LANGUAGES, getLanguage, columnStyle, hasRomanization } from '@/utils/languages';
import { cn } from '@/lib/utils';
import { Plus, Trash2, ArrowRight } from 'lucide-react';

interface LanguageColumnsDialogProps {
  open: boolean;
  columns: ColumnConfig[];
  onOpenChange: (open: boolean) => void;
  onChange: (columns: ColumnConfig[]) => void;
}

const MAX_COLUMNS = 4;

export const LanguageColumnsDialog: React.FC<LanguageColumnsDialogProps> = ({
  open,
  columns,
  onOpenChange,
  onChange,
}) => {
  const usedLangs = columns.map(c => c.lang);

  const setLang = (index: number, lang: string) => {
    if (usedLangs.includes(lang)) return;
    const next = columns.map((c, i) => (i === index ? { ...c, lang, showRomanization: hasRomanization(lang) } : c));
    onChange(next);
  };

  const addColumn = () => {
    const candidate = PICKABLE_LANGUAGES.find(l => !usedLangs.includes(l.code));
    if (!candidate || columns.length >= MAX_COLUMNS) return;
    onChange([...columns, { lang: candidate.code, visible: true, muted: false, showRomanization: hasRomanization(candidate.code) }]);
  };

  const removeColumn = (index: number) => {
    if (columns.length <= 2) return;
    onChange(columns.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Column languages</DialogTitle>
          <DialogDescription>
            The first column on the left is the main language. Every other column is translated from it —
            missing translations are generated automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {columns.map((column, index) => {
            const language = getLanguage(column.lang);
            const style = columnStyle(index);
            const base = index === 0 ? MAIN_LANGUAGES : PICKABLE_LANGUAGES;
            const options = base.some(l => l.code === column.lang) ? base : [language, ...base];

            return (
              <div key={`${column.lang}-${index}`} className="flex items-center gap-3 rounded-lg border border-border bg-secondary/40 p-3">
                <div className={cn('w-2 h-10 rounded-full', style.solid)} />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
                    <span>Column {index + 1}</span>
                    {index === 0 ? (
                      <span className="rounded bg-primary px-1.5 py-0.5 text-primary-foreground">main</span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <ArrowRight className="w-3 h-3" /> translated
                      </span>
                    )}
                  </div>
                  <select
                    value={column.lang}
                    onChange={e => setLang(index, e.target.value)}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {options.map(option => (
                      <option key={option.code} value={option.code} disabled={usedLangs.includes(option.code) && option.code !== column.lang}>
                        {option.name} — {option.native}
                      </option>
                    ))}
                  </select>
                  {language.romanizationLabel && (
                    <label className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={column.showRomanization}
                        onChange={e =>
                          onChange(columns.map((c, i) => (i === index ? { ...c, showRomanization: e.target.checked } : c)))
                        }
                      />
                      Show {language.romanizationLabel} above the word
                    </label>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeColumn(index)}
                  disabled={columns.length <= 2}
                  title="Remove column"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={addColumn} disabled={columns.length >= MAX_COLUMNS} className="gap-1.5">
            <Plus className="w-4 h-4" /> Add language
          </Button>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LanguageColumnsDialog;
