import { ALBUM_MENU, type AlbumMenuDefinition } from './albumMeta';
import { STICKERS as WC_2026_OFFICIAL_LABELS } from './stickers';

export type { AlbumBackground, ItemLabels } from './albumMeta';

export type AlbumDefinition = AlbumMenuDefinition & { labels: readonly string[] };

export const ALBUMS: readonly AlbumDefinition[] = ALBUM_MENU.map((meta) => ({
  ...meta,
  labels: WC_2026_OFFICIAL_LABELS,
})) as readonly AlbumDefinition[];

export { DEFAULT_ALBUM_ID } from './albumMeta';

export function getAlbumById(id: string): AlbumDefinition | undefined {
  return ALBUMS.find((a) => a.id === id);
}

export function catalogRowsForAlbum(albumId: string): { id: number; label: string }[] {
  const album = getAlbumById(albumId);
  if (!album) return [];
  return album.labels.map((label, i) => ({ id: i + 1, label }));
}
