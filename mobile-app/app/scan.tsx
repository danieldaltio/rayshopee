import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter, Stack } from 'expo-router';
import { searchBySku } from '../src/lib/api';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function ScanScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [lastCode, setLastCode] = useState(null);

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Precisamos de acesso à câmera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Conceder Permissão</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned) return;
    setScanned(true);
    setLastCode(data);

    try {
      const result = await searchBySku(data);
      if (result.items?.length) {
        router.replace({ pathname: '/products/[id]', params: { id: result.items[0].item_id } });
      } else if (result.item) {
        router.replace({ pathname: '/products/[id]', params: { id: result.item.item_id } });
      } else if (result.item_id) {
        router.replace({ pathname: '/products/[id]', params: { id: result.item_id } });
      } else {
        router.replace({ pathname: '/products/[id]', params: { id: data } });
      }
    } catch (err) {
      router.replace({ pathname: '/products/[id]', params: { id: data } });
    }

    setTimeout(() => setScanned(false), 3000);
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Escanear Código' }} />
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'code128', 'code39', 'qr'] }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />
      <View style={styles.overlay}>
        <View style={styles.scanArea} />
      </View>
      {lastCode && (
        <View style={styles.lastCodeContainer}>
          <Text style={styles.lastCodeText}>Último: {lastCode}</Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => router.back()}
      >
        <Ionicons name="close" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}