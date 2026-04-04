import { useState } from 'react';
import { Analytics } from '@vercel/analytics/react';

import AlbumMenuPage from './pages/AlbumMenuPage';
import DashboardPage from './pages/DashboardPage';
import { persistSelectedAlbumId } from './lib/stickerStorage';

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'tracker'>('menu');

  const handleSelectAlbum = (albumId: string) => {
    persistSelectedAlbumId(albumId);
    setScreen('tracker');
  };

  if (screen === 'menu') {
    return (
      <>
        <AlbumMenuPage onSelectAlbum={handleSelectAlbum} />
        <Analytics />
      </>
    );
  }

  return (
    <>
      <DashboardPage onOpenAlbumMenu={() => setScreen('menu')} />
      <Analytics />
    </>
  );
}
