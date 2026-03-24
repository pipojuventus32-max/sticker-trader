import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Alert, FlatList, Share, Text, TextInput, TouchableOpacity, View } from 'react-native';

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

  // LONG PRESS = RESET (NO ALERT)
  const handleLongPress = (item: any) => {
    setStickers(prev =>
      prev.map(s =>
        s.id === item.id ? { ...s, count: 0 } : s
      )
    );
  };

  // CLEAR ALL
  const clearAll = () => {
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

  // SHARE FUNCTIONS
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

      {/* TITLE */}
      <Text style={{ color:'#fff', textAlign:'center', marginTop:50, fontSize:24 }}>
        Sticker Tracker
      </Text>

      {/* PROGRESS */}
      <Text style={{ color:'#fff', textAlign:'center', marginBottom:10 }}>
        {owned} collected • {STICKERS.length - owned} missing • {Math.floor((owned / STICKERS.length) * 100)}%
      </Text>

      {/* SHARE BUTTONS */}
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
            paddingVertical:8,
            paddingHorizontal:12,
            borderRadius:6
          }}
        >
          <Text style={{ color:'white', fontWeight:'bold' }}>Share Missing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={shareDuplicates}
          disabled={!hasDuplicates}
          style={{
            backgroundColor: '#0066cc',
            paddingVertical:8,
            paddingHorizontal:12,
            borderRadius:6
          }}
        >
          <Text style={{ color:'white', fontWeight:'bold' }}>Share Duplicates</Text>
        </TouchableOpacity>
      </View>

      {/* CLEAR ALL */}
      <TouchableOpacity
        onPress={clearAll}
        style={{
          backgroundColor:'#ff8800',
          marginHorizontal:20,
          paddingVertical:10,
          borderRadius:6,
          marginBottom:10,
          alignItems:'center'
        }}
      >
        <Text style={{
          color:'#fff',
          fontWeight:'bold'
        }}>
          Clear All
        </Text>
      </TouchableOpacity>

      {/* SEARCH */}
      <TextInput
        placeholder="Search..."
        placeholderTextColor="#888"
        value={search}
        onChangeText={setSearch}
        style={{
          backgroundColor:'#222',
          color:'#fff',
          marginHorizontal:10,
          marginBottom:10,
          padding:10,
          borderRadius:8
        }}
      />

      {/* FILTERS */}
      <View style={{
        flexDirection:'row',
        justifyContent:'space-around',
        marginBottom:10
      }}>
        {['all','missing','owned','duplicates'].map(f => {
          const isActive = filter === f;

          return (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f as any)}
              style={{
                backgroundColor: isActive ? '#00cc66' : '#222',
                paddingVertical:6,
                paddingHorizontal:12,
                borderRadius:20
              }}
            >
              <Text style={{
                color: isActive ? '#000' : '#aaa',
                fontSize:14,
                fontWeight:'bold'
              }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* GRID */}
      <FlatList
        data={filtered}
        numColumns={5}
        columnWrapperStyle={{ justifyContent: 'flex-start', paddingHorizontal: 6 }}
        keyExtractor={(item) => item.id.toString()}
        initialNumToRender={50}
        maxToRenderPerBatch={50}
        windowSize={10}
        updateCellsBatchingPeriod={16}
        contentContainerStyle={{ paddingBottom: 20 }}
        keyboardShouldPersistTaps="always"
        scrollEventThrottle={16}
        extraData={stickers}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => handlePress(item)}
            onLongPress={() => handleLongPress(item)}
            activeOpacity={1}
            style={{
              flexBasis: '18%',
              maxWidth: '18%',
              margin: 4
            }}
          >
            <View style={{
              height: 40,
              backgroundColor:
                item.count === 0 ? '#333' :
                item.count === 1 ? 'green' : 'blue',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 10
            }}>
              <Text style={{
                color: '#fff',
                fontSize: 9,
                textAlign: 'center'
              }}>
                {item.label}
              </Text>

              {item.count > 1 && (
                <Text style={{
                  position: 'absolute',
                  top: 2,
                  right: 4,
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 'bold'
                }}>
                  {item.count}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
      {filtered.length === 0 && (
        <View style={{
          position:'absolute',
          top:0,
          left:0,
          right:0,
          bottom:0,
          justifyContent:'center',
          alignItems:'center'
        }}>
          <Text style={{
            color:'#888',
            fontSize:18,
            textAlign:'center'
          }}>
            {search
              ? 'No results found'
              : filter === 'missing'
              ? 'You collected everything 🎉'
              : filter === 'duplicates'
              ? 'No duplicates yet'
              : 'No stickers'}
          </Text>
        </View>
      )}

    </View>
  );
}