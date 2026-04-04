import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { useMemo, useState } from 'react';

import { auth } from '../lib/firebase';
import { Button, Card, CardHeader, Container, Divider, Input } from '../components/ui';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const canSubmit = useMemo(() => {
    return isValidEmail(email) && password.trim().length >= 6 && !busy;
  }, [email, password, busy]);

  const handleLogin = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: any) {
      alert(e?.message ?? 'Login failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleRegister = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: any) {
      alert(e?.message ?? 'Registration failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Container>
      <div className="grid min-h-[calc(100vh-80px)] place-items-center">
        <Card className="w-full max-w-md overflow-hidden">
          <CardHeader
            title="Sticker Trader"
            subtitle="Sign in to track your collection, missing stickers, and duplicates."
          />
          <Divider />
          <div className="px-6 py-6 space-y-4">
            <Input
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
            />
            <Input
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              type="password"
              autoComplete="current-password"
            />

            <div className="pt-2 grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={handleLogin} disabled={!canSubmit}>
                {busy ? 'Please wait…' : 'Login'}
              </Button>
              <Button onClick={handleRegister} disabled={!canSubmit}>
                {busy ? 'Please wait…' : 'Register'}
              </Button>
            </div>

            <div className="text-xs text-white/55">
              Your session is kept using Firebase Auth in the browser. No passwords are stored locally.
            </div>
          </div>
        </Card>
      </div>
    </Container>
  );
}

