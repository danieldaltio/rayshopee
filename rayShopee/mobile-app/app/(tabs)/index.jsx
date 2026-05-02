import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Vibration } from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { apiFetch, getHealth } from '../../src/lib/api';

export default function ScannerTab() {
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const router = useRouter();

  useEffect(() => {
    getHealth()
      .then((h) => { setStats(h); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, []);

  const handleBarcode = async ({ data }) => {
    if (scanned) return;
    setScanned(true);
    Vibration.vibrate(50);

    try {
      setLoading(true);
      const res = await apiFetch(`/products?sku=${encodeURIComponent(data)}`);
      const products = res.products || [];

      if (products.length === 0) {
        setError(`SKU "${data}" não encontrado na Shopee.`);        setScanned(false);
        setLoading(false);
        return;
      }

      const primary = products[0];
      router.push({ pathname: '/produto/[id]', params: { id: primary.item_id, sku: data } });
    } catch (e) {
      setError(e.message);
      setScanned(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={S.container}>
      {!scanned ? (
        <CameraView
          style={S.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code_39', 'code_128', 'itf14', 'codabar', 'code_93'] }}
          onBarcodeScanned={handleBarcode}
        >
          <View style={S.overlay}>
            <Text style={S.title}>📷 Escaneie o Código de Barras</Text>
            <View style={S.frame} />
            <Text style={S.hint}>Posicione o código dentro da moldura</Text>
          </View>
        </CameraView>
      ) : loading ? (
        <View style={S.centered}>
          <Text style={S.loadingText}>🔄 Buscando produto...</Text>
        </View>
      ) : error ? (
        <View style={S.centered}>
          <Text style={S.errorText}>{error}</Text>
          <Text style={S.retryBtn} onPress={() => { setScanned(false); setError(null); }}>🔄 Tentar novamente</Text>
        </View>
      ) : null}

      {stats && (
        <View style={S.statusBar}>
          <Text style={S.statusText}>🛒 {stats.shopId ? `Loja ${stats.shopId}` : 'Sem loja'}</Text>
          <Text style={S.statusText}>🔑 {stats.hasToken ? '✅' : '❌'}</Text>
        </View>
      )}
    </View>
  );
}

const S = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#06060f' },
  camera: { flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(6,6,15,0.5)', justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 32 },
  frame: { width: 280, height: 160, borderWidth: 3, borderColor: '#ffd60a', borderRadius: 12 },
  hint: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 20 },
  centered: { flex: 1, backgroundColor: '#06060f', justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingText: { color: '#fff', fontSize: 16 },
  errorText: { color: '#ef4444', fontSize: 16, textAlign: 'center', marginBottom: 24 },
  retryBtn: { color: '#ffd60a', fontSize: 16, fontWeight: '700', textDecorationLine: 'underline' },
  statusBar: { position: 'absolute', top: 60, right: 16, backgroundColor: 'rgba(6,6,15,0.85)', padding: 8, borderRadius: 8, gap: 4 },
  statusText: { color: '#eef0f6', fontSize: 12 },
});