import { ALBUM_MENU, type AlbumMenuDefinition } from './albumMeta';
import { STICKERS as WC_2026_OFFICIAL_LABELS } from './stickers';

export type { AlbumBackground, ItemLabels } from './albumMeta';

export type AlbumDefinition = AlbumMenuDefinition & { labels: readonly string[] };

function numRange(from: number, to: number): string[] {
  return Array.from({ length: to - from + 1 }, (_, i) => String(from + i));
}

const FIFA_365_LABELS: string[] = [
  ...numRange(1, 524),
  ...Array.from({ length: 88 }, (_, i) => `B${i + 1}`),
];

function labelsFor(meta: AlbumMenuDefinition): readonly string[] {
  switch (meta.id) {
    case 'panini-wc-stickers-2026':
      return WC_2026_OFFICIAL_LABELS;
    case 'adrenalyn-xl-2026':
      return numRange(1, 630);
    case 'fifa-365-2026':
      return FIFA_365_LABELS;
    case 'euroleague-2025-26':
      return numRange(1, 424);
    default:
      return [];
  }
}

export const ALBUMS: readonly AlbumDefinition[] = ALBUM_MENU.map((meta) => {
  const labels = labelsFor(meta);
  return { ...meta, labels };
}) as readonly AlbumDefinition[];

export { DEFAULT_ALBUM_ID } from './albumMeta';

export function getAlbumById(id: string): AlbumDefinition | undefined {
  return ALBUMS.find((a) => a.id === id);
}

export function catalogRowsForAlbum(albumId: string): { id: number; label: string }[] {
  const album = getAlbumById(albumId);
  if (!album) return [];
  return album.labels.map((label, i) => ({ id: i + 1, label }));
}
