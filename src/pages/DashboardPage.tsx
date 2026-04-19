import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Button, Card, CardHeader, Container, Divider, Input, Pill } from '../components/ui';
import { getAlbumById } from '../data/albums';
import { WC_2026_TEAM_CODES } from '../data/stickers';
import { WC_2026_COUNTRY_ROWS, wc2026RowForCode } from '../data/wc2026CountryLabels';
import { loadSelectedAlbumId } from '../lib/albumSelection';
import { shareText } from '../lib/share';
import { loadStickerRows, persistStickerRows, type StickerRow } from '../lib/stickerStorage';

type Filter = 'all' | 'missing' | 'owned' | 'duplicates' | 'teams';

const LONG_PRESS_MS = 420;

/** Strip ZWSP/BOM etc. and fullwidth digits so `SUI 1` always parses like `SUI 2`. */
function sanitizeWcStickerLabel(raw: string): string {
  return raw
    .trim()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .normalize('NFKC')
    .replace(/[\uFF10-\uFF19]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30));
}

/** Labels like `BRA 12` / `FWC 5` (team or section code + number). */
function parseWcStyleStickerLabel(label: string): { code: string; num: string } | null {
  const t = sanitizeWcStickerLabel(label);
  const m = /^([A-Za-z]{2,4})\s+(\d+)$/.exec(t);
  return m ? { code: m[1].toUpperCase(), num: m[2] } : null;
}

function teamCodeFromLabel(label: string): string | null {
  const t = sanitizeWcStickerLabel(label);
  if (t === '00') return 'FWC';
  return parseWcStyleStickerLabel(label)?.code ?? null;
}

/** Grid text from slot id + official team order (same as `STICKERS` catalog) — never parse `label` for layout. */
const WC_2026_SLOTS_PER_TEAM = 20;
const WC_2026_TOTAL_SLOTS = WC_2026_TEAM_CODES.length * WC_2026_SLOTS_PER_TEAM;

function wc2026DisplayFromSlotId(slotId: number): { line1: string; line2: string } | null {
  const i = slotId - 1;
  if (i < 0 || i >= WC_2026_TOTAL_SLOTS) return null;
  if (slotId === 1) return { line1: '00', line2: '' };
  if (slotId >= 2 && slotId <= 20) return { line1: 'FWC', line2: String(slotId - 1) };
  return {
    line1: WC_2026_TEAM_CODES[Math.floor(i / WC_2026_SLOTS_PER_TEAM)]!,
    line2: String((i % WC_2026_SLOTS_PER_TEAM) + 1),
  };
}

/** Fallback if slot id is ever out of sync with the catalog. */
function splitWc2026GridLabel(label: string): { line1: string; line2: string } | null {
  const t = sanitizeWcStickerLabel(label);
  const strict = parseWcStyleStickerLabel(t);
  if (strict) return { line1: strict.code, line2: strict.num };
  const glued = /^([A-Za-z]{2,4})(\d+)$/.exec(t);
  if (glued) return { line1: glued[1].toUpperCase(), line2: glued[2] };
  const loose = /^([A-Za-z]{2,4})\s+(.+)$/u.exec(t);
  if (loose) return { line1: loose[1].toUpperCase(), line2: loose[2].trim() };
  return null;
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
  const wcLines = wc2026DisplayFromSlotId(id) ?? splitWc2026GridLabel(label);

  const tone =
    count === 0
      ? 'border-slate-300 bg-slate-100 text-slate-700'
      : count === 1
        ? 'border-[#16a34a] bg-[#bbf7d0] text-slate-900 shadow-[0_3px_12px_rgba(22,163,74,0.2)]'
        : 'border-[#2563eb] bg-[#bfdbfe] text-slate-900 shadow-[0_3px_12px_rgba(37,99,235,0.22)]';

  return (
    <div
      role="button"
      tabIndex={0}
      title="Click: +1 • Hold: -1 • Right-click disabled"
      aria-label={`${label}, count ${count}. Tap to add one, long press to remove one.`}
      onClick={() => onCellClick(id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onCellClick(id);
        }
      }}
      onPointerDown={() => onCellPointerDown(id)}
      onPointerUp={() => onCellPointerEnd(id)}
      onPointerCancel={() => onCellPointerEnd(id)}
      onPointerLeave={() => onCellPointerEnd(id)}
      onContextMenu={(e) => e.preventDefault()}
      className={`focus-ring relative flex min-h-14 cursor-pointer touch-manipulation select-none items-stretch rounded-xl border-2 py-1 text-xs font-extrabold leading-tight tracking-tight shadow-sm transition-[filter,box-shadow] duration-75 active:brightness-[0.94] sm:h-14 sm:text-sm ${tone}`}
    >
      {wcLines ? (
        wcLines.line2 === '' ? (
          <div className="flex min-h-[2.55rem] w-full flex-1 items-center justify-center px-0.5 py-0.5 text-center text-[0.62rem] font-extrabold leading-tight opacity-95 tabular-nums sm:min-h-0 sm:text-sm">
            {wcLines.line1}
          </div>
        ) : (
          <div
            className="grid min-h-[2.55rem] w-full flex-1 grid-cols-1 grid-rows-2 items-center justify-items-center gap-y-1 px-0.5 py-0.5 text-center opacity-95 sm:min-h-0 sm:gap-y-1 sm:px-1"
            style={{ gridTemplateRows: 'minmax(0,1fr) minmax(0,1fr)' }}
          >
            <span className="col-start-1 row-start-1 block w-full max-w-full text-[0.62rem] leading-tight sm:text-sm">
              {wcLines.line1}
            </span>
            <span className="col-start-1 row-start-2 block w-full max-w-full min-h-[0.7em] text-[0.62rem] leading-tight tabular-nums sm:min-h-0 sm:text-sm">
              {wcLines.line2}
            </span>
          </div>
        )
      ) : (
        <div className="flex min-w-0 max-w-full flex-1 items-center justify-center px-1.5 text-center opacity-95 sm:px-2">
          <span className="block break-words text-xs sm:text-sm">{label}</span>
        </div>
      )}
      {count > 1 ? (
        <span
          className="pointer-events-none absolute right-0.5 top-0.5 z-10 flex min-h-3 min-w-3 items-center justify-center rounded border border-[#e30613] bg-[#ffd700] px-0.5 py-px text-[7px] font-extrabold leading-none tabular-nums text-slate-900 sm:right-1 sm:top-1 sm:min-h-3.5 sm:min-w-3.5 sm:text-[8px]"
          aria-hidden
        >
          {count - 1}
        </span>
      ) : null}
    </div>
  );
});

function percent(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.floor(n)));
}

export default function DashboardPage() {
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

  const countryListFiltered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [...WC_2026_COUNTRY_ROWS];
    return WC_2026_COUNTRY_ROWS.filter(
      (r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q),
    );
  }, [search]);

  const filtered = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    return stickers.filter((s) => {
      const label = (s.label || '').toLowerCase();
      if (filter === 'teams') {
        if (teamFilter === null) return false;
        if (teamCodeFromLabel(s.label) !== teamFilter) return false;
        if (s.count !== 0) return false;
        if (searchText && !label.includes(searchText)) return false;
        return true;
      }
      if (searchText && !label.includes(searchText)) return false;
      if (filter === 'missing') return s.count === 0;
      if (filter === 'owned') return s.count >= 1;
      if (filter === 'duplicates') return s.count > 1;
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
      <Card className="overflow-clip">
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
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
              </div>
              <div className="flex w-full justify-stretch border-t border-slate-200 pt-3 sm:w-auto sm:shrink-0 sm:justify-end sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 md:pl-5">
                <Pill
                  active={filter === 'teams'}
                  tone="default"
                  onClick={() => {
                    setFilter('teams');
                    setTeamFilter(null);
                  }}
                  className="sm:min-w-[8.5rem]"
                >
                  By country
                </Pill>
              </div>
            </div>
          </div>
        </div>

        <Divider />

        {filter === 'teams' ? (
          teamFilter === null ? (
            <div className="px-4 pb-20 pt-4 sm:px-6 sm:pb-5 sm:pt-5">
              <p className="mb-3 text-sm leading-relaxed text-slate-600">
                Sections follow the album order. Tap one to see the{' '}
                <span className="font-bold text-slate-800">missing</span> {itemsPlural} for that country
                or group.
              </p>
              <div className="mx-auto space-y-1.5">
                {countryListFiltered.map((row) => (
                  <button
                    key={row.code}
                    type="button"
                    className="focus-ring w-full rounded-xl border-2 border-slate-200/90 bg-white/90 px-4 py-3 text-left text-sm font-semibold leading-snug text-slate-900 transition-[border-color,background-color,filter] duration-150 hover:border-[#00a99d]/45 hover:bg-white active:brightness-[0.98] sm:py-3.5 sm:text-[15px]"
                    onClick={() => setTeamFilter(row.code)}
                  >
                    {row.listLabel}
                  </button>
                ))}
              </div>
              {countryListFiltered.length === 0 ? (
                <div className="mt-4 text-sm text-slate-600">No sections match your search.</div>
              ) : null}
            </div>
          ) : (
            <div className="p-4 pb-24 sm:p-6 sm:pb-8">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                <Button variant="ghost" className="min-h-10 w-full px-3 text-sm sm:w-auto" onClick={() => setTeamFilter(null)}>
                  ← All countries
                </Button>
                <div className="min-w-0 flex-1">
                  <div className="text-base font-extrabold leading-snug text-slate-900 sm:text-lg">
                    {wc2026RowForCode(teamFilter)?.listLabel ?? teamFilter}
                  </div>
                  <div className="mt-0.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                    Missing {itemsPlural} only
                  </div>
                </div>
              </div>
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
                  No missing {itemsPlural} in this section{search.trim() ? ' for your search' : ''}.
                </div>
              ) : null}
            </div>
          )
        ) : (
          <div className="p-4 pb-24 sm:p-6 sm:pb-8">
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
        )}
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
