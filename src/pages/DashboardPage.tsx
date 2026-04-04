import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { Button, Card, CardHeader, Container, Divider, Input, Pill } from '../components/ui';
import { getAlbumById } from '../data/albums';
import { shareText } from '../lib/share';
import { loadSelectedAlbumId, loadStickerRows, persistStickerRows, type StickerRow } from '../lib/stickerStorage';

type Filter = 'all' | 'missing' | 'owned' | 'duplicates';

function percent(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.floor(n)));
}

export default function DashboardPage({ onOpenAlbumMenu }: { onOpenAlbumMenu: () => void }) {
  const [albumId] = useState(() => loadSelectedAlbumId());
  const [stickers, setStickers] = useState<StickerRow[]>(() => loadStickerRows(loadSelectedAlbumId()));
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
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

  const filtered = useMemo(() => {
    const searchText = search.trim().toLowerCase();
    return stickers.filter((s) => {
      const label = (s.label || '').toLowerCase();
      if (searchText && !label.includes(searchText)) return false;
      if (filter === 'missing') return s.count === 0;
      if (filter === 'owned') return s.count >= 1;
      if (filter === 'duplicates') return s.count > 1;
      return true;
    });
  }, [stickers, search, filter]);

  const handlePress = (item: StickerRow) => {
    setStickers((prev) => {
      const updated = [...prev];
      const index = updated.findIndex((s) => s.id === item.id);
      if (index !== -1) updated[index] = { ...updated[index], count: updated[index].count + 1 };
      return updated;
    });
  };

  const handleDecrement = (item: StickerRow) => {
    setStickers((prev) => {
      const updated = [...prev];
      const index = updated.findIndex((s) => s.id === item.id);
      if (index !== -1) {
        const next = Math.max(0, updated[index].count - 1);
        updated[index] = { ...updated[index], count: next };
      }
      return updated;
    });
  };

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

  const headerSubtitle =
    totalSlots > 0
      ? `${owned} collected • ${totalSlots - owned} missing • ${percent((owned / totalSlots) * 100)}%`
      : '';

  return (
    <Container>
      <div className="mb-3 flex justify-start sm:mb-4">
        <Button variant="ghost" className="min-h-10 px-3 text-sm" onClick={onOpenAlbumMenu}>
          ← Albums
        </Button>
      </div>
      <Card className="overflow-hidden">
        <CardHeader title={album?.fullName ?? 'Sticker Tracker'} subtitle={headerSubtitle} />
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
                    onClick={() => setFilter(f)}
                  >
                    {label}
                  </Pill>
                );
              })}
            </div>
          </div>
        </div>

        <Divider />

        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-7 gap-2 sm:gap-2.5">
            {filtered.map((item) => {
              const tone =
                item.count === 0
                  ? 'border-slate-300 bg-slate-100 text-slate-700'
                  : item.count === 1
                    ? 'border-[#16a34a] bg-[#bbf7d0] text-slate-900 shadow-[0_3px_12px_rgba(22,163,74,0.2)]'
                    : 'border-[#2563eb] bg-[#bfdbfe] text-slate-900 shadow-[0_3px_12px_rgba(37,99,235,0.22)]';

              const longPressMs = 420;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (longPressConsumeClickRef.current === item.id) {
                      longPressConsumeClickRef.current = null;
                      return;
                    }
                    handlePress(item);
                  }}
                  onPointerDown={() => {
                    const id = item.id;
                    const prev = longPressTimersRef.current.get(id);
                    if (prev !== undefined) window.clearTimeout(prev);

                    const timeoutId = window.setTimeout(() => {
                      longPressTimersRef.current.delete(id);
                      longPressConsumeClickRef.current = id;
                      handleDecrement(item);
                    }, longPressMs);

                    longPressTimersRef.current.set(id, timeoutId);
                  }}
                  onPointerUp={() => {
                    const t = longPressTimersRef.current.get(item.id);
                    if (t !== undefined) {
                      window.clearTimeout(t);
                      longPressTimersRef.current.delete(item.id);
                    }
                  }}
                  onPointerCancel={() => {
                    const t = longPressTimersRef.current.get(item.id);
                    if (t !== undefined) {
                      window.clearTimeout(t);
                      longPressTimersRef.current.delete(item.id);
                    }
                  }}
                  onPointerLeave={() => {
                    const t = longPressTimersRef.current.get(item.id);
                    if (t !== undefined) {
                      window.clearTimeout(t);
                      longPressTimersRef.current.delete(item.id);
                    }
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                  title="Click: +1 • Hold: -1 • Right-click disabled"
                  className={`focus-ring group relative flex min-h-12 touch-manipulation select-none items-center justify-center rounded-xl border-2 text-[10px] font-extrabold leading-tight tracking-tight transition active:scale-[0.97] shadow-sm sm:h-12 sm:text-[11px] sm:active:scale-100 sm:hover:translate-y-[-1px] ${tone}`}
                >
                  <div className="px-2 text-center opacity-95">{item.label}</div>
                  {item.count > 1 ? (
                    <div className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-[#e30613] bg-[#ffd700] px-1 text-[10px] font-extrabold text-slate-900 shadow-sm">
                      {item.count - 1}
                    </div>
                  ) : null}
                </button>
              );
            })}
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
