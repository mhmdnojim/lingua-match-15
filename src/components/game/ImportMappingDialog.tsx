import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ColumnMapping, SheetData } from '@/utils/excelParser';
import { PICKABLE_LANGUAGES, LANGUAGES, getLanguage } from '@/utils/languages';
import { cn } from '@/lib/utils';

export type ColumnRole = 'main' | 'column' | 'extra';

export interface MappingRoles {
  /** language of the main (source) column */
  mainLang: string;
  /** languages shown as playable columns, main first */
  columnLangs: string[];
  /** languages that are not in the file and must be translated with AI */
  generateLangs: string[];
}


interface ImportMappingDialogProps {
  open: boolean;
  sheet: SheetData | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (mapping: ColumnMapping, roles: MappingRoles) => void;
}

const ROLE_OPTIONS: { value: ColumnRole; label: string; hint: string }[] = [
  { value: 'main', label: 'Main', hint: 'Source language — everything is translated from it' },
  { value: 'column', label: 'Secondary', hint: 'Shown as a playable column' },
  { value: 'extra', label: 'Stored only', hint: 'Saved with the words, not shown on the board' },
];

export const ImportMappingDialog: React.FC<ImportMappingDialogProps> = ({ open, sheet, onOpenChange, onConfirm }) => {
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [roles, setRoles] = useState<Record<string, ColumnRole>>({});
  /** languages the file does not have — generated with AI. code -> board or stored */
  const [generated, setGenerated] = useState<{ lang: string; role: 'column' | 'extra' }[]>([]);

  useEffect(() => {
    setGenerated([]);


    if (!sheet) return;
    const initialMapping: ColumnMapping = {};
    const initialRoles: Record<string, ColumnRole> = {};
    let mainTaken = false;
    sheet.headers.forEach((header, index) => {
      const lang = sheet.detected[header] || 'ignore';
      initialMapping[header] = lang;
      if (lang === 'ignore') {
        initialRoles[header] = 'extra';
        return;
      }
      if (!mainTaken) {
        initialRoles[header] = 'main';
        mainTaken = true;
      } else {
        initialRoles[header] = index < 4 ? 'column' : 'extra';
      }
    });
    setMapping(initialMapping);
    setRoles(initialRoles);
  }, [sheet]);

  if (!sheet) return null;

  const assignedHeaders = sheet.headers.filter(h => (mapping[h] || 'ignore') !== 'ignore');
  const assigned = assignedHeaders.map(h => mapping[h]);
  const duplicate = assigned.length !== new Set(assigned).size;
  const mainHeader = assignedHeaders.find(h => roles[h] === 'main');
  const generatedColumns = generated.filter(g => g.role === 'column');
  const columnCount =
    assignedHeaders.filter(h => roles[h] === 'column').length + (mainHeader ? 1 : 0) + generatedColumns.length;
  const tooManyColumns = columnCount > 4;
  const usedLangs = new Set([...assigned, ...generated.map(g => g.lang)]);
  const addableLanguages = PICKABLE_LANGUAGES.filter(l => !usedLangs.has(l.code));



  const setRole = (header: string, role: ColumnRole) => {
    setRoles(prev => {
      if (role === 'main') {
        const next: Record<string, ColumnRole> = { ...prev };
        Object.keys(next).forEach(key => {
          if (next[key] === 'main') next[key] = 'column';
        });
        next[header] = 'main';
        return next;
      }
      return { ...prev, [header]: role };
    });
  };

  const handleConfirm = () => {
    if (!mainHeader) return;
    const mainLang = mapping[mainHeader];
    const secondary = assignedHeaders.filter(h => h !== mainHeader && roles[h] === 'column');
    const extras = assignedHeaders.filter(h => h !== mainHeader && roles[h] !== 'column');

    // main first, then playable columns, then stored-only languages
    const ordered: ColumnMapping = { [mainHeader]: mainLang };
    [...secondary, ...extras].forEach(h => {
      ordered[h] = mapping[h];
    });
    sheet.headers.forEach(h => {
      if (!(h in ordered)) ordered[h] = 'ignore';
    });

    onConfirm(ordered, {
      mainLang,
      columnLangs: [
        mainLang,
        ...secondary.map(h => mapping[h]),
        ...generatedColumns.map(g => g.lang),
      ].slice(0, 4),
      generateLangs: generated.map(g => g.lang),
    });

  };

  const previewRows = sheet.rows.slice(0, 3);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Map the columns of your file</DialogTitle>
          <DialogDescription>
            Check the detected language of each column against the sample words below and correct anything that looks
            wrong. Choose one main column, up to three secondary columns on the board, and any number of extra
            languages that are only stored. Missing languages are generated with AI.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left font-medium">Column</th>
                <th className="px-3 py-2 text-left font-medium">Sample words</th>
                <th className="px-3 py-2 text-left font-medium">Language</th>
                <th className="px-3 py-2 text-left font-medium">Use as</th>
              </tr>
            </thead>
            <tbody>
              {sheet.headers.map(header => {
                const lang = mapping[header] || 'ignore';
                const ignored = lang === 'ignore';
                const detected = sheet.detected[header];
                const mismatch = detected && detected !== lang;
                const samples = previewRows
                  .map(row => String(row[header] ?? '').trim())
                  .filter(Boolean);

                return (
                  <tr key={header} className="border-t border-border align-top">
                    <td className="px-3 py-3">
                      <div className="max-w-[10rem] truncate font-medium text-foreground" title={header}>
                        {header}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {detected ? `detected: ${getLanguage(detected).name}` : 'not detected'}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="max-w-[14rem] space-y-0.5 text-xs text-muted-foreground">
                        {samples.length > 0 ? (
                          samples.map((sample, i) => (
                            <div key={i} className="truncate" title={sample}>
                              {sample}
                            </div>
                          ))
                        ) : (
                          <span className="italic">empty</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={lang}
                        onChange={e => setMapping(prev => ({ ...prev, [header]: e.target.value }))}
                        className={cn(
                          'w-full min-w-[11rem] rounded-md border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary',
                          mismatch ? 'border-primary' : 'border-border',
                        )}
                      >
                        <option value="ignore">Ignore this column</option>
                        {PICKABLE_LANGUAGES.map(l => (
                          <option key={l.code} value={l.code}>
                            {l.native} — {l.name}
                          </option>
                        ))}
                        <optgroup label="Transliteration columns">
                          {LANGUAGES.filter(l => l.romanizationOf).map(l => (
                            <option key={l.code} value={l.code}>
                              {getLanguage(l.romanizationOf!).name} — transliteration
                            </option>
                          ))}
                        </optgroup>
                      </select>
                      {mismatch && <p className="pt-1 text-xs text-primary">changed from the detected language</p>}
                    </td>
                    <td className="px-3 py-3">
                      {ignored ? (
                        <span className="text-xs italic text-muted-foreground">not imported</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {ROLE_OPTIONS.map(option => (
                            <button
                              key={option.value}
                              type="button"
                              title={option.hint}
                              onClick={() => setRole(header, option.value)}
                              className={cn(
                                'rounded-full border px-3 py-1 text-xs transition-colors',
                                roles[header] === option.value
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : 'border-border bg-background text-muted-foreground hover:text-foreground',
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>



        {duplicate && (
          <p className="text-sm text-destructive">Two columns are mapped to the same language — pick different ones.</p>
        )}
        {!mainHeader && assignedHeaders.length > 0 && (
          <p className="text-sm text-destructive">Choose one column as the main language.</p>
        )}
        {tooManyColumns && (
          <p className="text-sm text-destructive">
            Only 4 columns fit on the board — set the extra ones to “Stored only”.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!mainHeader || duplicate || tooManyColumns} onClick={handleConfirm}>
            Import
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportMappingDialog;
