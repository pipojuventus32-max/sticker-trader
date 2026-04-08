import { useLayoutEffect } from 'react';

import { Card, Container, Divider } from '../components/ui';
import type { AlbumMenuDefinition } from '../data/albumMeta';
import { ALBUM_MENU } from '../data/albumMeta';

function prefetchTracker() {
  void import('./DashboardPage');
}

function AlbumCard({
  album,
  onSelect,
}: {
  album: AlbumMenuDefinition;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      onPointerEnter={prefetchTracker}
      onFocus={prefetchTracker}
      className="focus-ring group w-full rounded-2xl border-2 border-slate-200/90 bg-white/80 p-4 text-left shadow-inner shadow-slate-200/60 transition-[border-color,background-color,box-shadow,filter] duration-150 hover:border-[#00a99d]/50 hover:bg-white hover:shadow-[0_8px_28px_rgba(15,23,42,0.08)] active:brightness-[0.97] sm:p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-base font-extrabold leading-snug text-slate-900 sm:text-lg">{album.shortName}</div>
          <div className="mt-1 line-clamp-2 text-xs leading-snug text-slate-600 sm:text-sm">{album.fullName}</div>
        </div>
      </div>
      <div className="mt-3 text-xs font-bold text-slate-500">
        {album.slotCount} {album.itemLabels.plural}
      </div>
    </button>
  );
}

export default function AlbumMenuPage({ onSelectAlbum }: { onSelectAlbum: (albumId: string) => void }) {
  useLayoutEffect(() => {
    document.body.dataset.bgTheme = 'default';
  }, []);

  return (
    <Container>
      <div className="mb-6 text-center sm:mb-8">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Sticker Tracker</h1>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">Choose an album to track your collection.</p>
      </div>

      <Card className="overflow-clip">
        <div className="px-4 pb-2 pt-4 sm:px-6 sm:pb-3 sm:pt-6">
          <div className="mb-3 h-1 w-14 rounded-full bg-gradient-to-r from-[#e30613] via-[#ffd700] to-[#2563eb]" />
          <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">Albums</h2>
          <p className="mt-2 text-sm text-slate-600">Your counts are saved per album on this device.</p>
        </div>
        <Divider />
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:gap-4 sm:p-6">
          {ALBUM_MENU.map((album) => (
            <AlbumCard key={album.id} album={album} onSelect={() => onSelectAlbum(album.id)} />
          ))}
        </div>
      </Card>
    </Container>
  );
}
