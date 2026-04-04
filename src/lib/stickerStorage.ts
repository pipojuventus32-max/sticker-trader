import {
  ALBUMS,
  catalogRowsForAlbum,
  DEFAULT_ALBUM_ID,
  getAlbumById,
  type AlbumDefinition,
} from '../data/albums';

export type StickerRow = { id: number; label: string; count: number };

const STORAGE_MULTI = 'sticker-tracker:multi:v1';
const STORAGE_LEGACY_V2 = 'sticker-tracker:counts:v2';
const SELECTED_KEY = 'sticker-tracker:selected-album:v1';

type MultiStore = {
  albums: Record<string, Record<string, number>>;
};

function emptyMultiStore(): MultiStore {
  return { albums: {} };
}

function parseMulti(raw: string | null): MultiStore {
  if (!raw) return emptyMultiStore();
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return emptyMultiStore();
    const albums = (parsed as MultiStore).albums;
    if (!albums || typeof albums !== 'object') return emptyMultiStore();
    return { albums: { ...albums } };
  } catch {
    return emptyMultiStore();
  }
}

function migrateLegacyIfNeeded(): MultiStore {
  let store = parseMulti(localStorage.getItem(STORAGE_MULTI));
  if (Object.keys(store.albums).length > 0) return store;

  const legacy = localStorage.getItem(STORAGE_LEGACY_V2);
  if (!legacy) return store;

  try {
    const map = JSON.parse(legacy) as Record<string, number>;
    if (map && typeof map === 'object') {
      store = {
        albums: {
          'panini-wc-stickers-2026': { ...map },
        },
      };
      localStorage.setItem(STORAGE_MULTI, JSON.stringify(store));
    }
  } catch {
    /* ignore */
  }
  return store;
}

function readStore(): MultiStore {
  return migrateLegacyIfNeeded();
}

function writeStore(store: MultiStore): void {
  try {
    localStorage.setItem(STORAGE_MULTI, JSON.stringify(store));
  } catch {
    /* quota */
  }
}

export function loadSelectedAlbumId(): string {
  try {
    const id = localStorage.getItem(SELECTED_KEY);
    if (id && getAlbumById(id)) return id;
  } catch {
    /* */
  }
  return DEFAULT_ALBUM_ID;
}

export function persistSelectedAlbumId(albumId: string): void {
  if (!getAlbumById(albumId)) return;
  try {
    localStorage.setItem(SELECTED_KEY, albumId);
  } catch {
    /* */
  }
}

export function loadStickerRows(albumId: string): StickerRow[] {
  const baseTemplates = catalogRowsForAlbum(albumId);
  if (baseTemplates.length === 0) return [];

  const store = readStore();
  const map = store.albums[albumId] ?? {};

  return baseTemplates.map((row) => {
    const n = map[String(row.id)];
    return {
      ...row,
      count: typeof n === 'number' && Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0,
    };
  });
}

export function persistStickerRows(albumId: string, rows: StickerRow[]): void {
  const store = readStore();
  const map: Record<string, number> = {};
  for (const r of rows) map[String(r.id)] = r.count;
  store.albums[albumId] = map;
  writeStore(store);
}

export function listAlbums(): readonly AlbumDefinition[] {
  return ALBUMS;
}
