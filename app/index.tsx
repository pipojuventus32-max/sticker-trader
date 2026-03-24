import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import Dashboard from './dashboard';
import Login from './login';

export default function App() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const checkUser = async () => {
      const stored = await AsyncStorage.getItem('user');

      if (stored) {
        setUser(JSON.parse(stored));
      } else {
        setUser(null);
      }
    };

    checkUser();
  }, []);

  if (user === undefined) return null;

  if (!user) return <Login />;

  return <Dashboard />;
}