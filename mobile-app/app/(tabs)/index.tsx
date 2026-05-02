import { View, Text, StyleSheet } from 'react-native';

export default function HomeTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>RayShopee</Text>
      <Text style={styles.subtitle}>Gerencie seus produtos Shopee</Text>
      <View style={styles.info}>
        <Text style={styles.infoText}>
          Use a aba "Escanear" para ler códigos de barras{'\n'}
          ou a aba "Produtos" para buscar por SKU.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  info: {
    backgroundColor: '#f0f0f5',
    padding: 20,
    borderRadius: 12,
    maxWidth: 300,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});