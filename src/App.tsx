import { Navigate, Route, Routes } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect, useMemo, useState } from 'react';

import { auth } from './lib/firebase';
import { readStoredUser, writeStoredUser, type StoredUser } from './lib/storage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

type AuthState =
  | { status: 'loading' }
  | { status: 'signed_out' }
  | { status: 'signed_in'; user: StoredUser };

export default function App() {
  const initialUser = useMemo(() => readStoredUser(), []);
  const [authState, setAuthState] = useState<AuthState>(
    initialUser ? { status: 'signed_in', user: initialUser } : { status: 'loading' },
  );

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) {
        writeStoredUser(null);
        setAuthState({ status: 'signed_out' });
        return;
      }

      const stored: StoredUser = { uid: u.uid, email: u.email };
      writeStoredUser(stored);
      setAuthState({ status: 'signed_in', user: stored });
    });
    return () => unsub();
  }, []);

  if (authState.status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="glass rounded-2xl px-6 py-4 text-sm text-white/80">Loading…</div>
      </div>
    );
  }

  const signedIn = authState.status === 'signed_in';

  return (
    <Routes>
      <Route path="/" element={<Navigate to={signedIn ? '/dashboard' : '/login'} replace />} />
      <Route path="/login" element={signedIn ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route
        path="/dashboard"
        element={signedIn ? <DashboardPage user={authState.user} /> : <Navigate to="/login" replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

