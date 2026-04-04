import { STICKERS as WC_2026_OFFICIAL_LABELS } from './stickers';

export type AlbumBackground = 'panini' | 'default';

/** User-facing words for what you collect (stickers vs trading cards, etc.) */
export type ItemLabels = { singular: string; plural: string };

export type AlbumDefinition = {
  id: string;
  /** Short label for the selector */
  shortName: string;
  /** Full product name */
  fullName: string;
  labels: readonly string[];
  background: AlbumBackground;
  searchPlaceholder: string;
  itemLabels: ItemLabels;
};

function numRange(from: number, to: number): string[] {
  return Array.from({ length: to - from + 1 }, (_, i) => String(from + i));
}

const STICKER: ItemLabels = { singular: 'sticker', plural: 'stickers' };
const CARD: ItemLabels = { singular: 'card', plural: 'cards' };

const FIFA_365_LABELS: string[] = [
  ...numRange(1, 524),
  ...Array.from({ length: 88 }, (_, i) => `B${i + 1}`),
];

export const ALBUMS: readonly AlbumDefinition[] = [
  {
    id: 'panini-wc-stickers-2026',
    shortName: 'WC 2026 Stickers',
    fullName: 'FIFA World Cup 2026™ Official Stickers',
    labels: WC_2026_OFFICIAL_LABELS,
    background: 'panini',
    searchPlaceholder: 'Try: FWC 1, BRA 20…',
    itemLabels: STICKER,
  },
  {
    id: 'adrenalyn-xl-2026',
    shortName: 'WC 2026 Adrenalyn XL',
    fullName: 'FIFA WORLD CUP 2026™ ADRENALYN XL™',
    labels: numRange(1, 630),
    background: 'default',
    searchPlaceholder: 'Try: 1, 630, 42…',
    itemLabels: CARD,
  },
  {
    id: 'fifa-365-2026',
    shortName: 'FIFA 365 2026',
    fullName: 'FIFA 365 2026',
    labels: FIFA_365_LABELS,
    background: 'default',
    searchPlaceholder: 'Try: 1, 524, B1, B88…',
    itemLabels: STICKER,
  },
  {
    id: 'euroleague-2025-26',
    shortName: 'EuroLeague 2025-26',
    fullName: 'EuroLeague 2025-26',
    labels: numRange(1, 424),
    background: 'default',
    searchPlaceholder: 'Try: 1, 424…',
    itemLabels: STICKER,
  },
] as const;

export const DEFAULT_ALBUM_ID = ALBUMS[0].id;

export function getAlbumById(id: string): AlbumDefinition | undefined {
  return ALBUMS.find((a) => a.id === id);
}

export function catalogRowsForAlbum(albumId: string): { id: number; label: string }[] {
  const album = getAlbumById(albumId);
  if (!album) return [];
  return album.labels.map((label, i) => ({ id: i + 1, label }));
}
