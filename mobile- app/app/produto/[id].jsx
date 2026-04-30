import { useState, useEffect, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { apiFetch, formatPrice } from '../../src/lib/api';
import { useProductEditor } from '../../src/hooks/useProductEditor';

function EditableField({ label, value, field, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  useEffect(() => { setDraft(String(value)); }, [value]); // reset when value changes externally

  const save = () => { onChange(field, draft); setEditing(false); };
  const cancel = () => { setDraft(String(value)); setEditing(false); };

  return (
    <View style={S.field}>
      <Text style={S.fieldLabel}>{label}</Text>
      {editing ? (
        <View style={S.editRow}>
          <TextInput style={S.editInput} value={draft} onChangeText={setDraft} keyboardType="numeric" autoFocus selectTextOnFocus />
          <TouchableOpacity style={S.saveBtn} onPress={save}><Text style={S.saveBtnText}>OK</Text></TouchableOpacity>
          <TouchableOpacity style={S.cancelBtn} onPress={cancel}><Text style={S.cancelBtnText}>✕</Text></TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={() => setEditing(true)}><Text style={S.fieldValue}>{field === 'price' ? formatPrice(value) : value}</Text></TouchableOpacity>
      )}
    </View>
  );
}

export default function ProdutoDetail() {
  const { id, sku } = useLocalSearchParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pending, setPending] = useState({});
  const { loading: submitting, error: submitError, result: submitResult, submitUpdates } = useProductEditor();

  const itemId = parseInt(id);

  useEffect(() => {
    fetchProduct(itemId, sku);
  }, [itemId, sku]);

  const fetchProduct = async (itemId, searchSku) => {
    setLoading(true);
    setError(null);
    setPending({});
    try {
      let products = [];
      if (searchSku) {
        const res = await apiFetch(`/products?sku=${encodeURIComponent(searchSku)}`);
        products = (res.products || []).filter(p => String(p.item_id) === String(itemId));
      }
      if (products. length === 0) {
        const res = await apiFetch(`/products?item_id=${itemId}`);
        products = res.products || [];
      }
      if (products.length === 0) throw new Error('Produto não encontrado');
      setProduct(products);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = useCallback((idx, field, val) => {
    const num = field === 'price'
      ? parsePriceApi(val)
      : parseInt(val) || 0;
    setPending(prev => ({ ...prev, [`${idx}_${field}`]: num }));
    setProduct(prev => prev.map((p, i) => i === idx ? { ...p, [`pending_${field}`]: num } : p));
  }, []);

  const parsePriceApi = (v) => {
    const n = parseFloat(String(v).replace(',', '.').replace(/[^\d.]/g, ''));
    return Math.round(n * 100000);
  };

  const handleSave = async () => {
    const updates = product.map((p, i) => {
      const key = `${i}_price`;
      const sKey = `${i}_stock`;
      return {
        ...p,
        pendingPrice: pending[key] ?? p.price,
        pendingStock: pending[sKey] ?? p.stock,
        dirty: key in pending || sKey in pending,
      };
    });

    Alert.alert('Salvar Alterações', `Atualizar ${updates.filter(u => u.dirty).length} variação(ões) na Shopee?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salvar', onPress: () => saveAll(itemId, updates) },
    ]);
  };

  const saveAll = async (itemId, variations) => {
    const res = await submitUpdates(itemId, variations);
    if (!submitError) {
      await fetchProduct(itemId, sku);
    }
  };

  const hasChanges = Object.keys(pending).length > 0;
  const imageUrl = product?.[0]?.image;

  if (loading) return <View style={S.centered}><ActivityIndicator color="#ffd60a" size="large" /><Text style={S.loadingText}>Carregando...</Text></View>;
  if (error) return <View style={S.centered}><Text style={S.errorText}>{error}</Text><TouchableOpacity onPress={() => fetchProduct(itemId, sku)}><Text style={S.retry}>🔄 Tentar novamente</Text></TouchableOpacity></View>;
  if (!product) return null;

  return (    <View style={S.container}>
      <Stack.Screen options={{ title: product?.[0]?.name || 'Produto', headerShown: true, headerStyle: { backgroundColor: '#06060f' }, headerTintColor: '#fff', headerBackTitle: 'Voltar' }} />
      <ScrollView style={S.scrollView} contentContainerStyle={S.scrollContent}>
        {imageUrl ? <Image source={{ uri: imageUrl }} style={S.image} /> : null}
        <Text style={S.productName}>{product[0]?.name}</Text>
        <Text style={S.productSku}>SKU: {product[0]?.sku}</Text>
        <Text style={S.variationCount}>{product.length} variação(ões)</Text>
      </ScrollView>      <FlatList
        style={S.variationList}
        data={product}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item, index }) => (
          <View style={S.variationCard}>
            <View style={S.variationHeader}>
              <Text style={S.variationName}>{item.variation !== '—' ? item.variation : 'Principal'}</Text>
            </View>
            <View style={S.fieldsRow}>
              <View style={S.field}>
                <Text style={S.fieldLabel}>Preço atual</Text>
                <Text style={S.fieldValue}>{formatPrice(item.price)}</Text>              </View>
              <View style={S.field}>
                <Text style={S.fieldLabel}>Estoque atual</Text>
                <Text style={S.fieldValue}>{item.stock}</Text>
              </View>            </View>            <Text style={S.editTitle}>Alterar para:</Text>            <View style={S.fieldsRow}>
              <View style={S.field}>
                <Text style={S.fieldLabel}>Novo Preço</Text>
                <TextInput
                  style={S.input}                  placeholder={formatPrice(item.price)}
                  placeholderTextColor="#505672"
                  keyboardType="numeric"
                  onChangeText={(v) => handleChange(index, 'price', v)}
                />
              </View>              <View style={S.field}>
                <Text style={S.fieldLabel}>Novo Estoque</Text>
                <TextInput
                  style={S.input}
                  placeholder={String(item.stock)}
                  placeholderTextColor="#505672"
                  keyboardType="numeric"                  onChangeText={(v) => handleChange(index, 'stock', v)}
                />              </View>            </View>          </View>
        )}
      />
      {submitting && <View style={S.submitOverlay}><ActivityIndicator color="#ffd60a" size="large" /><Text style={S.loadingText}>Salvando na Shopee...</Text></View>}
      <TouchableOpacity style={[S.saveFab, !hasChanges && S.saveFabDisabled]} onPress={handleSave} disabled={!hasChanges || submitting}>        <Text style={S.saveFabText}>💾 Salvar Alterações</Text>
      </TouchableOpacity>    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06060f' },
  scrollView: { maxHeight: 220 },
  scrollContent: { padding: 16 },  image: { width: 80, height: 80, borderRadius: 8, marginBottom: 12 },
  productName: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  productSku: { color: '#8b92a8', fontSize: 13, marginBottom: 4 },
  variationCount: { color: '#ffd60a', fontSize: 13 },
  variationList: { flex: 1, padding: 16 },
  variationCard: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  variationHeader: { marginBottom: 12 },  variationName: { color: '#ffd60a', fontSize: 14, fontWeight: '700' },
  fieldsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  field: { flex: 1 },
  fieldLabel: { color: '#8b92a8', fontSize: 11, textTransform: 'uppercase', marginBottom: 4, letterSpacing: 0.5 },
  fieldValue: { color: '#eef0f6', fontSize: 16, fontWeight: '600' },
  editTitle: { color: '#eef0f6', fontSize: 12, marginBottom: 8 },
  input: { backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#eef0f6', fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  centered: { flex: 1, backgroundColor: '#06060f', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#eef0f6', fontSize: 14, marginTop: 12 },  errorText: { color: '#ef4444', fontSize: 14, textAlign: 'center', marginBottom: 16 },
  retry: { color: '#ffd60a', fontSize: 14 },
  saveFab: { position: 'absolute', bottom: 24, left: 16, right: 16, backgroundColor: '#ffd60a', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  saveFabDisabled: { backgroundColor: 'rgba(255,214,10,0.3)' },  saveFabText: { color: '#06060f', fontSize: 16, fontWeight: '700' },
  submitOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(6,6,15,0.8)', justifyContent: 'center', alignItems: 'center' },
});