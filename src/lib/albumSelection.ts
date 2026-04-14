import { DEFAULT_ALBUM_ID, isValidAlbumId } from '../data/albumMeta';

const SELECTED_KEY = 'sticker-tracker:selected-album:v1';

/** Single-album app: returns stored id only if valid (legacy keys), else WC 2026 default. */
export function loadSelectedAlbumId(): string {
  try {
    const id = localStorage.getItem(SELECTED_KEY);
    if (id && isValidAlbumId(id)) return id;
  } catch {
    /* */
  }
  return DEFAULT_ALBUM_ID;
}
