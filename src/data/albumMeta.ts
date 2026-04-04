/** Menu + validation only — keeps the first paint bundle small (no full label lists). */

export type AlbumBackground = 'default';

export type ItemLabels = { singular: string; plural: string };

export type AlbumMenuDefinition = {
  id: string;
  shortName: string;
  fullName: string;
  /** Must match `labels.length` in the full album catalog. */
  slotCount: number;
  background: AlbumBackground;
  searchPlaceholder: string;
  itemLabels: ItemLabels;
};

const STICKER: ItemLabels = { singular: 'sticker', plural: 'stickers' };
const CARD: ItemLabels = { singular: 'card', plural: 'cards' };

export const ALBUM_MENU: readonly AlbumMenuDefinition[] = [
  {
    id: 'panini-wc-stickers-2026',
    shortName: 'WC 2026 Stickers',
    fullName: 'FIFA World Cup 2026™ Official Stickers',
    slotCount: 960,
    background: 'default',
    searchPlaceholder: 'Try: FWC 1, BRA 20…',
    itemLabels: STICKER,
  },
  {
    id: 'adrenalyn-xl-2026',
    shortName: 'WC 2026 Adrenalyn XL',
    fullName: 'FIFA WORLD CUP 2026™ ADRENALYN XL™',
    slotCount: 630,
    background: 'default',
    searchPlaceholder: 'Try: 1, 630, 42…',
    itemLabels: CARD,
  },
  {
    id: 'fifa-365-2026',
    shortName: 'FIFA 365 2026',
    fullName: 'FIFA 365 2026',
    slotCount: 612,
    background: 'default',
    searchPlaceholder: 'Try: 1, 524, B1, B88…',
    itemLabels: STICKER,
  },
  {
    id: 'euroleague-2025-26',
    shortName: 'EuroLeague 2025-26',
    fullName: 'EuroLeague 2025-26',
    slotCount: 424,
    background: 'default',
    searchPlaceholder: 'Try: 1, 424…',
    itemLabels: STICKER,
  },
] as const;

export const DEFAULT_ALBUM_ID = ALBUM_MENU[0].id;

const ID_SET = new Set<string>(ALBUM_MENU.map((a) => a.id));

export function isValidAlbumId(id: string): boolean {
  return ID_SET.has(id);
}
