import { DEFAULT_ALBUM_ID, isValidAlbumId } from '../data/albumMeta';

const SELECTED_KEY = 'sticker-tracker:selected-album:v1';

export function loadSelectedAlbumId(): string {
  try {
    const id = localStorage.getItem(SELECTED_KEY);
    if (id && isValidAlbumId(id)) return id;
  } catch {
    /* */
  }
  return DEFAULT_ALBUM_ID;
}

export function persistSelectedAlbumId(albumId: string): void {
  if (!isValidAlbumId(albumId)) return;
  try {
    localStorage.setItem(SELECTED_KEY, albumId);
  } catch {
    /* */
  }
}
