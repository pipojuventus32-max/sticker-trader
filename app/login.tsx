import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function Login() {

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const res = await signInWithEmailAndPassword(auth, email, password);

      await AsyncStorage.setItem('user', JSON.stringify(res.user));

    } catch (e) {
      alert(e.message);
    }
  };

  const handleRegister = async () => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);

      await AsyncStorage.setItem('user', JSON.stringify(res.user));

    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#000' }}>

      <Text style={{ color: '#fff', fontSize: 24, marginBottom: 20 }}>
        Sticker Tracker Login
      </Text>

      <TextInput
        placeholder="Email"
        placeholderTextColor="#888"
        value={email}
        onChangeText={setEmail}
        style={{ backgroundColor: '#222', color: '#fff', marginBottom: 10, padding: 10 }}
      />

      <TextInput
        placeholder="Password"
        placeholderTextColor="#888"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ backgroundColor: '#222', color: '#fff', marginBottom: 20, padding: 10 }}
      />

      <TouchableOpacity onPress={handleLogin} style={{ backgroundColor: 'green', padding: 15, marginBottom: 10 }}>
        <Text style={{ color: '#fff', textAlign: 'center' }}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleRegister} style={{ backgroundColor: 'blue', padding: 15 }}>
        <Text style={{ color: '#fff', textAlign: 'center' }}>Register</Text>
      </TouchableOpacity>

    </View>
  );
}