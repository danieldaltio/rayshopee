import { useState } from 'react';
import { StyleSheet, View, Text, TextInput, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProductEditor, Variation } from '../../hooks/useProductEditor';
import { formatPrice, parsePrice } from '../../src/lib/api';

export default function ProductEditorScreen() {
  const [sku, setSku] = useState('');
  const { loading, error, result, product, searchProduct, updateVariation, submitUpdates, clearResult, resetProduct } = useProductEditor();

  const handleSearch = () => {
    if (sku.trim()) {
      searchProduct(sku.trim());
    }
  };

  const handleSubmit = () => {
    if (!product) return;

    const dirtyCount = product.variations.filter((v) => v.dirty).length;
    if (dirtyCount === 0) {
      Alert.alert('Aviso', 'Nenhuma alteração para salvar.');
      return;
    }

    Alert.alert(
      'Confirmar Atualização',
      `Salvar ${dirtyCount} alteração(ões)?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Salvar', onPress: submitUpdates },
      ]
    );
  };

  const handleResultDismiss = () => {
    if (result && result.failures === 0) {
      resetProduct();
      setSku('');
    }
    clearResult();
  };

  const renderVariation = ({ item }: { item: Variation }) => {
    const currentPrice = item.pendingPrice ?? item.price;
    const currentStock = item.pendingStock ?? item.stock;
    const isDirty = item.dirty;

    return (
      <View style={[styles.variationCard, isDirty && styles.variationDirty]}>
        <Text style={styles.variationName}>{item.name}</Text>
        
        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Preço:</Text>
          <TextInput
            style={[styles.fieldInput, isDirty && styles.fieldDirty]}
            value={item.pendingPrice !== undefined ? (item.pendingPrice / 100000).toFixed(2) : (item.price / 100000).toFixed(2)}
            keyboardType="decimal-pad"
            onChangeText={(text) => {
              const num = parsePrice(text);
              if (!isNaN(num)) {
                updateVariation(item.model_id, 'price', num);
              }
            }}
            placeholder={formatPrice(item.price)}
          />
        </View>

        <View style={styles.fieldRow}>
          <Text style={styles.fieldLabel}>Estoque:</Text>
          <TextInput
            style={[styles.fieldInput, isDirty && styles.fieldDirty]}
            value={item.pendingStock?.toString() ?? item.stock.toString()}
            keyboardType="number-pad"
            onChangeText={(text) => {
              const num = parseInt(text, 10);
              if (!isNaN(num)) {
                updateVariation(item.model_id, 'stock', num);
              }
            }}
            placeholder={item.stock.toString()}
          />
        </View>

        <Text style={styles.currentValues}>
          Atual: {formatPrice(item.price)} | Estoque: {item.stock}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Editor de Produto</Text>
      </View>

      <View style={styles.searchSection}>
        <TextInput
          style={styles.skuInput}
          value={sku}
          onChangeText={setSku}
          placeholder="Digite o SKU do produto"
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.searchButtonText}>Buscar</Text>}
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {result && (
        <View style={[styles.resultContainer, result.failures === 0 ? styles.successContainer : styles.errorResultContainer]}>
          <Text style={styles.resultText}>
            {result.failures === 0 ? 'Atualização concluída!' : `${result.failures} erro(s) encontrado(s)`}
          </Text>
          <TouchableOpacity onPress={handleResultDismiss}>
            <Text style={styles.dismissText}>OK</Text>
          </TouchableOpacity>
        </View>
      )}

      {product && (
        <View style={styles.productSection}>
          <Text style={styles.productName}>{product.item_name}</Text>
          <Text style={styles.itemId}>ID: {product.item_id}</Text>
          
          <FlatList
            data={product.variations}
            keyExtractor={(item) => item.model_id.toString()}
            renderItem={renderVariation}
            style={styles.variationsList}
          />

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Salvar Alterações</Text>}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#ff5722',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  searchSection: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  skuInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#ff5722',
    paddingHorizontal: 24,
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
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#ffebee',
    borderRadius: 8,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
  },
  resultContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  successContainer: {
    backgroundColor: '#e8f5e9',
  },
  errorResultContainer: {
    backgroundColor: '#ffebee',
  },
  resultText: {
    fontSize: 14,
  },
  dismissText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1976d2',
  },
  productSection: {
    flex: 1,
    padding: 16,
  },
  productName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  itemId: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 16,
  },
  variationsList: {
    flex: 1,
  },
  variationCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  variationDirty: {
    borderColor: '#ff9800',
    borderWidth: 2,
  },
  variationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    width: 60,
    fontSize: 14,
    color: '#757575',
  },
  fieldInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f5f5f5',
    borderRadius: 4,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  fieldDirty: {
    backgroundColor: '#fff3e0',
    borderColor: '#ff9800',
    borderWidth: 1,
  },
  currentValues: {
    fontSize: 12,
    color: '#9e9e9e',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});