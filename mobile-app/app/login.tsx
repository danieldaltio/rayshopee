import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../src/lib/api';

export default function LoginScreen() {
  const router = useRouter();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    if (!token.trim()) {
      setError('Digite seu token de acesso.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/auth/verify', {
        headers: { Authorization: `Bearer ${token.trim()}` },
      });
      router.replace('/(tabs)');
    } catch (err) {
      setError('Token inválido ou expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>RS</Text>
        <Text style={styles.title}>RayShopee</Text>
        <Text style={styles.subtitle}>Gerenciamento Mobile</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Token de Acesso</Text>
        <TextInput
          style={styles.input}
          placeholder="Cole seu token aqui..."
          value={token}
          onChangeText={setToken}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Entrar</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: { alignItems: 'center', marginBottom: 48 },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 12,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#222', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888' },
  form: { maxWidth: 340, alignSelf: 'center', width: '100%' },
  label: { fontSize: 14, fontWeight: '600', color: '#444', marginBottom: 8 },
  input: {
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  error: { color: '#d32f2f', fontSize: 13, marginBottom: 12 },
  button: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: { backgroundColor: '#b0d4f0' },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});