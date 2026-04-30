import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../src/lib/api';

export default function BuscarTab() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const router = useRouter();

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await apiFetch(`/products?q=${encodeURIComponent(query.trim())}`);
      setResults(res.products || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={S.container}>
      <Text style={S.title}>🔍 Buscar Produto</Text>
      <View style={S.searchRow}>
        <TextInput
          style={S.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Nome ou SKU do produto..."
          placeholderTextColor="#505672"
          returnKeyType="search"
          onSubmitEditing={search}
        />
        <TouchableOpacity style={S.btn} onPress={search} disabled={loading}>
          {loading ? <ActivityIndicator color="#06060f" /> : <Text style={S.btnText}>Buscar</Text>}
        </TouchableOpacity>
      </View>
      {error && <Text style={S.error}>{error}</Text>}
      <FlatList
        data={results}
        keyExtractor={(item) => `${item.item_id}_${item.model_id}`}
        style={S.list}
        contentContainerStyle={S.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={S.item}
            onPress={() => router.push({ pathname: '/produto/[id]', params: { id: item.item_id } })}
          >
            <View style={S.itemInfo}>
              <Text style={S.itemName} numberOfLines={2}>{item.name}</Text>
              <Text style={S.itemSku}>SKU: {item.sku || '—'}</Text>
              <Text style={S.itemVariation}>{item.variation !== '—' ? `Variação: ${item.variation}` : ''}</Text>
            </View>
            <View style={S.itemPrice}>
              <Text style={S.priceText}>R$ {(item.price / 100000).toFixed(2).replace('.', ',')}</Text>
              <Text style={S.stockText}>Est: {item.stock}</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={!loading && <Text style={S.empty}>Busque produtos por nome ou SKU</Text>}
      />
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06060f', paddingTop: 60, padding: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 20 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  input: { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#eef0f6', fontSize: 15 },
  btn: { backgroundColor: '#ffd60a', borderRadius: 10, paddingHorizontal: 20, justifyContent: 'center' },
  btnText: { color: '#06060f', fontWeight: '700', fontSize: 15 },
  error: { color: '#ef4444', fontSize: 13, marginBottom: 12 },
  list: { flex: 1 },
  listContent: { gap: 8, paddingBottom: 24 },
  item: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  itemInfo: { flex: 1 },
  itemName: { color: '#eef0f6', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  itemSku: { color: '#8b92a8', fontSize: 12 },
  itemVariation: { color: '#8b92a8', fontSize: 12, marginTop: 2 },
  itemPrice: { alignItems: 'flex-end', justifyContent: 'center' },
  priceText: { color: '#ffd60a', fontSize: 15, fontWeight: '700' },
  stockText: { color: '#8b92a8', fontSize: 12, marginTop: 4 },
  empty: { color: '#505672', fontSize: 14, textAlign: 'center', marginTop: 60 },
});