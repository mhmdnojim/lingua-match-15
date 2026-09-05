import React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { GripHorizontal, X } from 'lucide-react';

interface MeaningsPanelProps {
  title: string;
  meanings: string[];
  /** optional per-meaning gloss (e.g. the English disambiguation of that sense) */
  hints?: Record<string, string>;
  selected: string[];
  rtl?: boolean;
  fontClass?: string;
  /** card rectangle the panel opens above */
  anchor: DOMRect;
  onChange: (meanings: string[]) => void;
  onClose: () => void;
}

const PANEL_WIDTH = 240;

/** Floating, draggable list of every meaning of a word — check the ones to show on the card */
export const MeaningsPanel: React.FC<MeaningsPanelProps> = ({
  title,
  meanings,
  hints,
  selected,
  rtl,
  fontClass,
  anchor,
  onChange,
  onClose,
}) => {
  const panelRef = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState(() => ({
    x: Math.min(
      Math.max(8, anchor.left + anchor.width / 2 - PANEL_WIDTH / 2),
      Math.max(8, window.innerWidth - PANEL_WIDTH - 8),
    ),
    // opens above the flashcard; flips below when there is no room
    y: Math.max(8, anchor.top - 12),
  }));
  const [placedAbove, setPlacedAbove] = React.useState(true);
  const drag = React.useRef<{ dx: number; dy: number } | null>(null);

  React.useLayoutEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const height = el.offsetHeight;
    if (anchor.top - height - 12 < 8) {
      setPlacedAbove(false);
      setPos(p => ({ ...p, y: Math.min(anchor.bottom + 12, window.innerHeight - height - 8) }));
    } else {
      setPos(p => ({ ...p, y: anchor.top - height - 12 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const startDrag = (e: React.PointerEvent) => {
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onDrag = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const width = panelRef.current?.offsetWidth ?? PANEL_WIDTH;
    const height = panelRef.current?.offsetHeight ?? 0;
    setPos({
      x: Math.min(Math.max(0, e.clientX - drag.current.dx), window.innerWidth - width),
      y: Math.min(Math.max(0, e.clientY - drag.current.dy), window.innerHeight - height),
    });
  };
  const endDrag = () => {
    drag.current = null;
  };

  const toggle = (meaning: string) => {
    const next = selected.includes(meaning)
      ? selected.filter(m => m !== meaning)
      : [...selected, meaning].sort((a, b) => meanings.indexOf(a) - meanings.indexOf(b));
    onChange(next.length ? next : [meaning]);
  };

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={e => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div
        ref={panelRef}
        style={{ left: pos.x, top: pos.y, width: PANEL_WIDTH }}
        className={cn(
          'fixed z-50 rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl',
          placedAbove ? 'origin-bottom' : 'origin-top',
        )}
        onClick={e => e.stopPropagation()}
      >
        <div
          onPointerDown={startDrag}
          onPointerMove={onDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className="flex cursor-grab items-center gap-2 rounded-t-xl border-b border-border bg-secondary/60 px-2 py-1.5 active:cursor-grabbing"
        >
          <GripHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 truncate text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </span>
          <button
            onClick={onClose}
            className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close meanings"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <ul className="max-h-64 overflow-y-auto p-1.5">
          {meanings.map(meaning => {
            const checked = selected.includes(meaning);
            return (
              <li key={meaning}>
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground',
                    checked && 'bg-accent/60',
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(meaning)}
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-primary"
                  />
                  <span dir={rtl ? 'rtl' : 'ltr'} className={cn('min-w-0 flex-1 break-words', fontClass)}>
                    {meaning}
                    {hints?.[meaning] && (
                      <span className="block text-[10px] italic leading-tight text-muted-foreground" dir="ltr">
                        {hints[meaning]}
                      </span>
                    )}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>

        <p className="border-t border-border px-3 py-1.5 text-[10px] text-muted-foreground">
          Drag the header to move · check the meanings to show
        </p>
      </div>
    </>,
    document.body,
  );
};

export default MeaningsPanel;
