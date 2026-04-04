import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useEffect, useMemo, useRef, useState } from 'react';

import { db, auth } from '../lib/firebase';
import { STICKERS } from '../data/stickers';
import { shareText } from '../lib/share';
import type { StoredUser } from '../lib/storage';
import { Button, Card, CardHeader, Container, Divider, Input, Pill } from '../components/ui';

type StickerRow = { id: number; label: string; count: number };
type Filter = 'all' | 'missing' | 'owned' | 'duplicates';

function createDefault(): StickerRow[] {
  return STICKERS.map((label, index) => ({ id: index, label, count: 0 }));
}

function percent(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.floor(n)));
}

export default function DashboardPage({ user }: { user: StoredUser }) {
  const [stickers, setStickers] = useState<StickerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);

      if (snap.exists() && (snap.data() as any)?.stickers) {
        const data = (snap.data() as any).stickers as any[];
        const fixed = data.map((s: any, i: number) => ({
          id: Number.isFinite(s?.id) ? s.id : i,
          label: typeof s?.label === 'string' ? s.label : STICKERS[i],
          count: Number.isFinite(s?.count) ? s.count : 0,
        }));
        setStickers(fixed);
      } else {
        const def = createDefault();
        setStickers(def);
        await setDoc(ref, { stickers: def });
      }

      setLoading(false);
    };

    void loadData();
  }, [user.uid]);

  const save = async (data: StickerRow[]) => {
    await setDoc(doc(db, 'users', user.uid), { stickers: data });
  };

  useEffect(() => {
    if (loading) return;

    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      void save(stickers);
    }, 900);

    return () => {
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stickers]);

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

  const handleLongPress = (item: StickerRow) => {
    setStickers((prev) => {
      const updated = [...prev];
      const index = updated.findIndex((s) => s.id === item.id);
      if (index !== -1) updated[index] = { ...updated[index], count: 0 };
      return updated;
    });
  };

  const clearAll = async () => {
    const ok = window.confirm('Are you sure you want to reset all stickers?');
    if (!ok) return;
    const reset = stickers.map((s) => ({ ...s, count: 0 }));
    setStickers(reset);
    await save(reset);
  };

  const shareMissing = async () => {
    const list = stickers.filter((s) => s.count === 0).map((s) => s.label).join(', ');
    await shareText('Missing stickers', `Missing stickers:\n${list}`);
  };

  const shareDuplicates = async () => {
    const list = stickers
      .filter((s) => s.count > 1)
      .map((s) => `${s.label} x${s.count}`)
      .join(', ');
    await shareText('Duplicates', `Duplicates:\n${list}`);
  };

  const headerSubtitle = `${owned} collected • ${STICKERS.length - owned} missing • ${percent(
    (owned / STICKERS.length) * 100,
  )}%`;

  return (
    <Container>
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <div className="text-sm text-white/60">Signed in as</div>
          <div className="font-semibold">{user.email ?? user.uid}</div>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            void signOut(auth);
          }}
        >
          Sign out
        </Button>
      </div>

      <Card className="overflow-hidden">
        <CardHeader title="Sticker Tracker" subtitle={headerSubtitle} />
        <Divider />

        <div className="px-6 py-5 space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button variant="danger" onClick={shareMissing} disabled={!hasMissing}>
              Share Missing
            </Button>
            <Button variant="secondary" onClick={shareDuplicates} disabled={!hasDuplicates}>
              Share Duplicates
            </Button>
            <div className="flex-1" />
            <Button onClick={clearAll}>Clear All</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <Input
              label="Search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Try: FWC 1, BRA 20…"
            />

            <div>
              <div className="mb-2 text-sm font-medium text-white/80">Filter</div>
              <div className="flex flex-wrap gap-2">
                {(['all', 'missing', 'owned', 'duplicates'] as const).map((f) => (
                  <Pill key={f} active={filter === f} onClick={() => setFilter(f)}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </Pill>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Divider />

        {loading ? (
          <div className="px-6 py-10 text-sm text-white/70">Loading stickers…</div>
        ) : (
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-8 gap-2.5">
              {filtered.map((item) => {
                const tone =
                  item.count === 0
                    ? 'bg-white/6 border-white/10 text-white/80'
                    : item.count === 1
                      ? 'bg-emerald-500/16 border-emerald-300/20 text-white'
                      : 'bg-sky-500/16 border-sky-300/20 text-white';

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handlePress(item)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      handleLongPress(item);
                    }}
                    title="Click: +1 • Right-click: reset"
                    className={`focus-ring glass-strong group flex h-12 items-center justify-center rounded-xl border text-[11px] font-semibold tracking-tight transition hover:translate-y-[-1px] ${tone}`}
                  >
                    <div className="flex flex-col items-center leading-none">
                      <div className="opacity-95">{item.label}</div>
                      <div className="mt-1 text-[10px] font-medium text-white/70 group-hover:text-white/80">
                        x{item.count}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {filtered.length === 0 ? (
              <div className="mt-6 text-sm text-white/65">No stickers match your search/filter.</div>
            ) : null}
          </div>
        )}
      </Card>
    </Container>
  );
}

