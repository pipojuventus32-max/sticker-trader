import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Platform, Share, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { STICKERS } from '../data/stickers';
import { db } from '../firebase';

export default function Dashboard() {

  const [user, setUser] = useState<any>(null);
  const [stickers, setStickers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'missing' | 'owned' | 'duplicates'>('all');

  // LOAD USER
  useEffect(() => {
    const loadUser = async () => {
      const stored = await AsyncStorage.getItem('user');
      if (stored) setUser(JSON.parse(stored));
    };
    loadUser();
  }, []);

  // DEFAULT DATA
  const createDefault = () =>
    STICKERS.map((label, index) => ({
      id: index,
      label,
      count: 0,
    }));

  // LOAD STICKERS
  useEffect(() => {
    if (!user?.uid) return;

    const loadData = async () => {
      const ref = doc(db, 'users', user.uid);
      const snap = await getDoc(ref);

      if (snap.exists() && snap.data().stickers) {
        const data = snap.data().stickers;

        const fixed = data.map((s: any, i: number) => ({
          id: s.id ?? i,
          label: s.label ?? STICKERS[i],
          count: s.count ?? 0,
        }));

        setStickers(fixed);
      } else {
        const def = createDefault();
        setStickers(def);
        await setDoc(ref, { stickers: def });
      }

      setLoading(false);
    };

    loadData();
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;

    const timeout = setTimeout(() => {
      save(stickers);
    }, 500);

    return () => clearTimeout(timeout);
  }, [stickers]);

  // SAVE
  const save = async (data: any[]) => {
    if (!user?.uid) return;
    await setDoc(doc(db, 'users', user.uid), { stickers: data });
  };

  // TAP = +1
  const handlePress = (item: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    setStickers(prev =>
      prev.map(s =>
        s.id === item.id ? { ...s, count: s.count + 1 } : s
      )
    );
  };

  // LONG PRESS = RESET
  const handleLongPress = (item: any) => {
    setStickers(prev =>
      prev.map(s =>
        s.id === item.id ? { ...s, count: 0 } : s
      )
    );
  };

  // ✅ FIXED CLEAR ALL (WEB + MOBILE)
  const clearAll = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm("Are you sure you want to reset all stickers?");
      if (confirmed) {
        const reset = stickers.map(s => ({ ...s, count: 0 }));
        setStickers(reset);
        save(reset);
      }
      return;
    }

    Alert.alert(
      "Clear All",
      "Are you sure you want to reset all stickers?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: () => {
            const reset = stickers.map(s => ({ ...s, count: 0 }));
            setStickers(reset);
            save(reset);
          }
        }
      ]
    );
  };

  // PROGRESS
  const owned = stickers.filter(s => s.count > 0).length;
  const hasMissing = stickers.some(s => s.count === 0);
  const hasDuplicates = stickers.some(s => s.count > 1);

  // FILTER + SEARCH
  const filtered = stickers.filter(s => {
    const label = (s.label || '').toLowerCase();
    const matchSearch = label.includes((search || '').toLowerCase());

    if (!matchSearch) return false;

    if (filter === 'missing') return s.count === 0;
    if (filter === 'owned') return s.count >= 1;
    if (filter === 'duplicates') return s.count > 1;

    return true;
  });

  // SHARE
  const shareMissing = async () => {
    const list = stickers
      .filter(s => s.count === 0)
      .map(s => s.label)
      .join(', ');

    await Share.share({ message: `Missing stickers:\n${list}` });
  };

  const shareDuplicates = async () => {
    const list = stickers
      .filter(s => s.count > 1)
      .map(s => `${s.label} x${s.count}`)
      .join(', ');

    await Share.share({ message: `Duplicates:\n${list}` });
  };

  if (loading) {
    return (
      <View style={{ flex:1, justifyContent:'center', alignItems:'center', backgroundColor:'#000' }}>
        <Text style={{ color:'#fff' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex:1, backgroundColor:'#000' }}>

      <Text style={{ color:'#fff', textAlign:'center', marginTop:50, fontSize:24 }}>
        Sticker Tracker
      </Text>

      <Text style={{ color:'#fff', textAlign:'center', marginBottom:10 }}>
        {owned} collected • {STICKERS.length - owned} missing • {Math.floor((owned / STICKERS.length) * 100)}%
      </Text>

      <View style={{
        flexDirection:'row',
        justifyContent:'space-between',
        marginHorizontal:20,
        marginBottom:10
      }}>
        <TouchableOpacity
          onPress={shareMissing}
          disabled={!hasMissing}
          style={{
            backgroundColor: hasMissing ? 'red' : '#555',
            padding:8,
            borderRadius:6
          }}
        >
          <Text style={{ color:'white', fontWeight:'bold' }}>Share Missing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={shareDuplicates}
          disabled={!hasDuplicates}
          style={{
            backgroundColor:'#0066cc',
            padding:8,
            borderRadius:6
          }}
        >
          <Text style={{ color:'white', fontWeight:'bold' }}>Share Duplicates</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={clearAll}
        style={{
          backgroundColor:'#ff8800',
          margin:20,
          padding:10,
          borderRadius:6,
          alignItems:'center'
        }}
      >
        <Text style={{ color:'#fff', fontWeight:'bold' }}>Clear All</Text>
      </TouchableOpacity>

      <TextInput
        placeholder="Search..."
        placeholderTextColor="#888"
        value={search}
        onChangeText={setSearch}
        style={{
          backgroundColor:'#222',
          color:'#fff',
          margin:10,
          padding:10,
          borderRadius:8
        }}
      />

      <FlatList
        data={filtered}
        numColumns={5}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handlePress(item)}
            onLongPress={() => handleLongPress(item)}
            style={{
              flexBasis:'18%',
              maxWidth:'18%',
              margin:4
            }}
          >
            <View style={{
              height:40,
              backgroundColor:
                item.count === 0 ? '#333' :
                item.count === 1 ? 'green' : 'blue',
              alignItems:'center',
              justifyContent:'center',
              borderRadius:10
            }}>
              <Text style={{ color:'#fff', fontSize:9 }}>
                {item.label}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

    </View>
  );
}