const KEY = 'sticker-trader.user';

export type StoredUser = {
  uid: string;
  email: string | null;
};

export function readStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredUser;
    if (!parsed?.uid) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredUser(user: StoredUser | null) {
  if (!user) {
    localStorage.removeItem(KEY);
    return;
  }
  localStorage.setItem(KEY, JSON.stringify(user));
}

