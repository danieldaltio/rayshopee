import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { getProduct, bulkUpdate, formatPrice, parsePrice } from '../../src/lib/api';
import { useProductEditor } from '../../src/hooks/useProductEditor';

export default function ProductEditor() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { loading: saving, error: saveError, result, submitUpdates, clearResult } = useProductEditor();

  const [variations, setVariations] = useState([]);

  useEffect(() => {
    loadProduct();
  }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProduct(id);
      setProduct(data.item || data);
      const vars = (data.variations || data.models || []).map((v) => ({
        ...v,
        dirty: false,
        pendingPrice: null,
        pendingStock: null,
      }));
      setVariations(vars);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateVariation = (index, field, value) => {
    setVariations((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], dirty: true, [field]: value };
      return updated;
    });
  };

  const handleSave = async () => {
    await submitUpdates(id, variations);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={loadProduct}>
          <Text style={styles.buttonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: product?.item_name || 'Editar Produto' }} />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.productName} numberOfLines={2}>
            {product?.item_name}
          </Text>
          <Text style={styles.productSku}>SKU: {product?.item_sku}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Variações</Text>
          {variations.map((variation, index) => (
            <View key={variation.model_id || index} style={styles.variationCard}>
              <Text style={styles.variationName} numberOfLines={1}>
                {variation.model_name || variation.name || `Opção ${index + 1}`}
              </Text>
              <View style={styles.variationFields}>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Preço (R$)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="decimal-pad"
                    placeholder={formatPrice(variation.price || variation.item_price || 0)}
                    onChangeText={(text) => updateVariation(index, 'pendingPrice', text)}
                  />
                </View>
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>Estoque</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="number-pad"
                    placeholder={String(variation.stock || variation.stock_info?.total_available || 0)}
                    onChangeText={(text) => updateVariation(index, 'pendingStock', text)}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {result && (
          <View style={styles.successBanner}>
            <Text style={styles.successText}>
              {result.success} atualização(ões) aplicada(s)!
            </Text>
          </View>
        )}

        {(saveError || error) && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{saveError || error}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.saveButtonText}>Salvar Alterações</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { backgroundColor: '#fff', padding: 16, marginBottom: 12 },
  productName: { fontSize: 18, fontWeight: '600', color: '#222', marginBottom: 4 },
  productSku: { fontSize: 13, color: '#888' },
  section: { padding: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 12 },
  variationCard: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10 },
  variationName: { fontSize: 14, fontWeight: '500', color: '#444', marginBottom: 10 },
  variationFields: { flexDirection: 'row', gap: 12 },
  field: { flex: 1 },
  fieldLabel: { fontSize: 12, color: '#777', marginBottom: 4 },
  input: {
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  errorText: { color: '#d32f2f', fontSize: 14, textAlign: 'center' },
  successBanner: { margin: 12, padding: 12, backgroundColor: '#e8f5e9', borderRadius: 8 },
  successText: { color: '#2e7d32', fontSize: 14 },
  errorBanner: { margin: 12, padding: 12, backgroundColor: '#ffebee', borderRadius: 8 },
  errorBannerText: { color: '#c62828', fontSize: 14 },
  footer: { padding: 12, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
  saveButton: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontSize: 17, fontWeight: '600' },
});