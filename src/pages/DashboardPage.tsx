import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Button, Card, CardHeader, Container, Divider, Input, Pill } from '../components/ui';
import { getAlbumById } from '../data/albums';
import { loadSelectedAlbumId } from '../lib/albumSelection';
import { shareText } from '../lib/share';
import { loadStickerRows, persistStickerRows, type StickerRow } from '../lib/stickerStorage';

type Filter = 'all' | 'missing' | 'owned' | 'duplicates' | 'teams';

const LONG_PRESS_MS = 420;

/** Labels like `BRA 12` / `FWC 5` (team or section code + number). */
function teamCodeFromLabel(label: string): string | null {
  const m = /^([A-Z]{2,4}) (\d+)$/.exec(label.trim());
  return m ? m[1] : null;
}

function sortTeamCodes(codes: string[]): string[] {
  return [...codes].sort((a, b) => {
    if (a === 'FWC') return -1;
    if (b === 'FWC') return 1;
    return a.localeCompare(b);
  });
}

const StickerGridCell = memo(function StickerGridCell({
  id,
  label,
  count,
  onCellClick,
  onCellPointerDown,
  onCellPointerEnd,
}: {
  id: number;
  label: string;
  count: number;
  onCellClick: (id: number) => void;
  onCellPointerDown: (id: number) => void;
  onCellPointerEnd: (id: number) => void;
}) {
  const tone =
    count === 0
      ? 'border-slate-300 bg-slate-100 text-slate-700'
      : count === 1
        ? 'border-[#16a34a] bg-[#bbf7d0] text-slate-900 shadow-[0_3px_12px_rgba(22,163,74,0.2)]'
        : 'border-[#2563eb] bg-[#bfdbfe] text-slate-900 shadow-[0_3px_12px_rgba(37,99,235,0.22)]';

  return (
    <button
      type="button"
      onClick={() => onCellClick(id)}
      onPointerDown={() => onCellPointerDown(id)}
      onPointerUp={() => onCellPointerEnd(id)}
      onPointerCancel={() => onCellPointerEnd(id)}
      onPointerLeave={() => onCellPointerEnd(id)}
      onContextMenu={(e) => e.preventDefault()}
      title="Click: +1 • Hold: -1 • Right-click disabled"
      style={{ contentVisibility: 'auto', containIntrinsicSize: '56px 56px' }}
      className={`focus-ring relative flex min-h-14 touch-manipulation select-none items-center justify-center rounded-xl border-2 text-xs font-extrabold leading-tight tracking-tight shadow-sm transition-[filter,box-shadow] duration-75 active:brightness-[0.94] sm:h-14 sm:text-sm ${tone}`}
    >
      <div className="min-w-0 max-w-full px-1.5 text-center opacity-95 sm:px-2">{label}</div>
      {count > 1 ? (
        <span
          className="pointer-events-none absolute right-0.5 top-0.5 z-10 flex min-h-3 min-w-3 items-center justify-center rounded border border-[#e30613] bg-[#ffd700] px-0.5 py-px text-[7px] font-extrabold leading-none tabular-nums text-slate-900 sm:right-1 sm:top-1 sm:min-h-3.5 sm:min-w-3.5 sm:text-[8px]"
          aria-hidden
        >
          {count - 1}
        </span>
      ) : null}
    </button>
  );
});

function percent(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.floor(n)));
}

export default function DashboardPage({ onOpenAlbumMenu }: { onOpenAlbumMenu: () => void }) {
  const [albumId] = useState(() => loadSelectedAlbumId());
  const [stickers, setStickers] = useState<StickerRow[]>(() => loadStickerRows(loadSelectedAlbumId()));
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [teamFilter, setTeamFilter] = useState<string | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);

  const saveTimer = useRef<number | null>(null);
  const longPressConsumeClickRef = useRef<number | null>(null);
  const longPressTimersRef = useRef<Map<number, number>>(new Map());

  const album = getAlbumById(albumId);
  const totalSlots = album?.labels.length ?? 0;
  const itemsPlural = album?.itemLabels.plural ?? 'stickers';
  const itemsSingular = album?.itemLabels.singular ?? 'sticker';

  useLayoutEffect(() => {
    document.body.dataset.bgTheme = album?.background ?? 'default';
  }, [album?.background]);

  useEffect(() => {
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      persistStickerRows(albumId, stickers);
    }, 900);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
  }, [albumId, stickers]);

  const owned = useMemo(() => stickers.filter((s) => s.count > 0).length, [stickers]);
  const hasMissing = useMemo(() => stickers.some((s) => s.count === 0), [stickers]);
  const hasDuplicates = useMemo(() => stickers.some((s) => s.count > 1), [stickers]);

  /** Total copies beyond the first per slot (tradable extras). */
  const duplicateExtra = useMemo(
    () => stickers.reduce((sum, s) => sum + Math.max(0, s.count - 1), 0),
    [stickers],
  );

  const teamCodes = useMemo(() => {
    const set = new Set<string>();
    for (const s of stickers) {
      const code = teamCodeFromLabel(s.label);
      if (code) set.add(code);
    }
    return sortTeamCodes(Array.from(set));
  }, [stickers]);

  const showTeamsFilter = teamCodes.length >= 2;

  const filtered = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    return stickers.filter((s) => {
      const label = (s.label || '').toLowerCase();
      if (searchText && !label.includes(searchText)) return false;
      if (filter === 'teams') {
        if (teamFilter !== null && teamCodeFromLabel(s.label) !== teamFilter) return false;
      } else if (filter === 'missing') return s.count === 0;
      else if (filter === 'owned') return s.count >= 1;
      else if (filter === 'duplicates') return s.count > 1;
      return true;
    });
  }, [stickers, search, filter, teamFilter]);

  const bumpCount = useCallback((id: number, delta: 1 | -1) => {
    setStickers((prev) => {
      const updated = [...prev];
      const index = updated.findIndex((s) => s.id === id);
      if (index === -1) return prev;
      const next = Math.max(0, updated[index].count + delta);
      updated[index] = { ...updated[index], count: next };
      return updated;
    });
  }, []);

  const clearLongPressTimer = useCallback((id: number) => {
    const t = longPressTimersRef.current.get(id);
    if (t !== undefined) {
      window.clearTimeout(t);
      longPressTimersRef.current.delete(id);
    }
  }, []);

  const onCellPointerDown = useCallback(
    (id: number) => {
      clearLongPressTimer(id);
      const timeoutId = window.setTimeout(() => {
        longPressTimersRef.current.delete(id);
        longPressConsumeClickRef.current = id;
        bumpCount(id, -1);
      }, LONG_PRESS_MS);
      longPressTimersRef.current.set(id, timeoutId);
    },
    [bumpCount, clearLongPressTimer],
  );

  const onCellPointerEnd = useCallback(
    (id: number) => {
      clearLongPressTimer(id);
    },
    [clearLongPressTimer],
  );

  const onCellClick = useCallback(
    (id: number) => {
      if (longPressConsumeClickRef.current === id) {
        longPressConsumeClickRef.current = null;
        return;
      }
      bumpCount(id, 1);
    },
    [bumpCount],
  );

  const confirmClearAll = () => {
    const reset = stickers.map((s) => ({ ...s, count: 0 }));
    setStickers(reset);
    persistStickerRows(albumId, reset);
    setClearDialogOpen(false);
  };

  const shareLabel = album?.shortName ?? 'Album';

  const shareMissing = async () => {
    const list = stickers.filter((s) => s.count === 0).map((s) => s.label).join(', ');
    await shareText(
      `Missing ${itemsPlural} — ${shareLabel}`,
      `Missing ${itemsPlural} (${shareLabel}):\n${list}`,
    );
  };

  const shareDuplicates = async () => {
    const list = stickers
      .filter((s) => s.count > 1)
      .map((s) => s.label)
      .join(', ');
    await shareText(
      `Doubles — ${shareLabel}`,
      `Duplicate ${itemsPlural} (${shareLabel}):\n${list}`,
    );
  };

  const headerSubtitle = useMemo(() => {
    if (totalSlots <= 0) return '';
    const missing = totalSlots - owned;
    const pct = percent((owned / totalSlots) * 100);
    return `${owned} collected • ${missing} missing • ${pct}%`;
  }, [totalSlots, owned]);

  const headerDuplicates = useMemo(() => {
    if (totalSlots <= 0) return '';
    if (duplicateExtra === 1) return '1 duplicate';
    return `${duplicateExtra} duplicates`;
  }, [totalSlots, duplicateExtra]);

  return (
    <Container>
      <div className="mb-3 flex justify-start sm:mb-4">
        <Button variant="ghost" className="min-h-10 px-3 text-sm" onClick={onOpenAlbumMenu}>
          ← Albums
        </Button>
      </div>
      <Card className="overflow-hidden">
        <CardHeader
          title={album?.fullName ?? 'Sticker Tracker'}
          subtitle={headerSubtitle}
          subtitleExtra={headerDuplicates}
        />
        <Divider />

        <div className="space-y-4 px-4 py-4 sm:px-6 sm:py-5">
          <div className="w-full">
            <Input
              label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={album?.searchPlaceholder ?? 'Search…'}
              enterKeyHint="search"
              autoComplete="off"
              autoCorrect="off"
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-3">
            <Button
              className="w-full uppercase tracking-wide sm:w-auto"
              variant="danger"
              selected={filter === 'missing'}
              onClick={shareMissing}
              disabled={!hasMissing}
            >
              Share Missing
            </Button>
            <Button
              className="w-full uppercase tracking-wide sm:w-auto"
              variant="secondary"
              selected={filter === 'duplicates'}
              onClick={shareDuplicates}
              disabled={!hasDuplicates}
            >
              Share Doubles
            </Button>
            <Button className="w-full sm:w-auto" onClick={() => setClearDialogOpen(true)}>
              Clear All
            </Button>
          </div>

          <div>
            <div className="mb-2 text-sm font-bold text-slate-800">Filter</div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
              {(['all', 'missing', 'owned', 'duplicates'] as const).map((f) => {
                const label =
                  f === 'duplicates' ? 'Doubles' : f.charAt(0).toUpperCase() + f.slice(1);
                return (
                  <Pill
                    key={f}
                    active={filter === f}
                    tone={f === 'duplicates' ? 'blue' : 'default'}
                    onClick={() => {
                      setFilter(f);
                      setTeamFilter(null);
                    }}
                  >
                    {label}
                  </Pill>
                );
              })}
              {showTeamsFilter ? (
                <Pill
                  active={filter === 'teams'}
                  tone="default"
                  onClick={() => setFilter('teams')}
                  className="col-span-2 sm:col-span-1"
                >
                  By country
                </Pill>
              ) : null}
            </div>
            {filter === 'teams' && showTeamsFilter ? (
              <div className="mt-4">
                <div className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">
                  Country / section
                </div>
                <div className="-mx-1 flex max-w-full gap-1.5 overflow-x-auto px-1 pb-1 pt-0.5 [scrollbar-width:thin]">
                  <Pill
                    active={teamFilter === null}
                    tone="default"
                    onClick={() => setTeamFilter(null)}
                    className="w-auto shrink-0 px-3"
                  >
                    All
                  </Pill>
                  {teamCodes.map((code) => (
                    <Pill
                      key={code}
                      active={teamFilter === code}
                      tone="default"
                      onClick={() => setTeamFilter(code)}
                      className="w-auto shrink-0 px-3 font-mono text-xs"
                    >
                      {code}
                    </Pill>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <Divider />

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
            {filtered.map((item) => (
              <StickerGridCell
                key={item.id}
                id={item.id}
                label={item.label}
                count={item.count}
                onCellClick={onCellClick}
                onCellPointerDown={onCellPointerDown}
                onCellPointerEnd={onCellPointerEnd}
              />
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="mt-6 text-sm text-slate-600">
              No {itemsPlural} match your search/filter.
            </div>
          ) : null}
        </div>
      </Card>

      {clearDialogOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-4 pb-[max(1rem,var(--safe-bottom))] backdrop-blur-sm sm:items-center sm:pb-4"
          role="presentation"
          onClick={() => setClearDialogOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="clear-dialog-title"
            className="glass-strong w-full max-w-sm rounded-2xl p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="clear-dialog-title" className="text-lg font-extrabold text-slate-900">
              Clear all counts?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              This resets every {itemsSingular} to zero. You can&apos;t undo this from the app.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
              <Button variant="ghost" className="w-full sm:w-auto" onClick={() => setClearDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" className="w-full sm:w-auto" onClick={confirmClearAll}>
                Clear all
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </Container>
  );
}
