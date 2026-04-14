/** Menu + validation — single album (FIFA World Cup 2026 Panini stickers, 980 slots). */

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

export const ALBUM_MENU: readonly AlbumMenuDefinition[] = [
  {
    id: 'panini-wc-stickers-2026',
    shortName: 'WC 2026 Stickers',
    fullName: 'FIFA WORLD CUP 2026™ Official Sticker Collection',
    slotCount: 980,
    background: 'default',
    searchPlaceholder: 'Try: FWC 1, BRA 20…',
    itemLabels: STICKER,
  },
] as const;

export const DEFAULT_ALBUM_ID = ALBUM_MENU[0].id;

const ID_SET = new Set<string>(ALBUM_MENU.map((a) => a.id));

export function isValidAlbumId(id: string): boolean {
  return ID_SET.has(id);
}
