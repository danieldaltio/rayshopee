import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { searchBySku, formatPrice } from '../../src/lib/api';

export default function ProductsTab() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const result = await searchBySku(query.trim());
      setProducts(result.items || []);
      if (!result.items?.length) {
        setError('Nenhum produto encontrado.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.input}
          placeholder="Buscar por SKU..."
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.searchButtonText}>Buscar</Text>
          )}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={products}
        keyExtractor={(item) => String(item.item_id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                Digite um SKU para buscar produtos
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.productCard}
            onPress={() => router.push(`/products/${item.item_id}`)}
          >
            <Text style={styles.productName} numberOfLines={2}>
              {item.item_name}
            </Text>
            <Text style={styles.productSku}>SKU: {item.item_sku}</Text>
            <View style={styles.productInfo}>
              <Text style={styles.productPrice}>
                {formatPrice(item.item_price)}
              </Text>
              <Text style={styles.productStock}>
                Estoque: {item.stock || 0}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    gap: 8,
  },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: '#f0f0f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  searchButton: {
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    margin: 12,
    marginBottom: 0,
    padding: 12,
    backgroundColor: '#ffe5e5',
    borderRadius: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
  },
  list: {
    padding: 12,
    gap: 10,
  },
  empty: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: '#999',
    fontSize: 14,
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    marginBottom: 4,
  },
  productSku: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  productInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  productPrice: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '700',
  },
  productStock: {
    fontSize: 13,
    color: '#555',
  },
});