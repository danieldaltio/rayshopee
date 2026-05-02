import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function ScannerModal({ onClose, onScan }) {
  const [error, setError] = useState('');

  useEffect(() => {
    // We create a scanner instance
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: {width: 250, height: 250} },
      /* verbose= */ false
    );

    scanner.render(
      (decodedText) => {
        // Success
        scanner.clear();
        onScan(decodedText);
      },
      (errorMessage) => {
        // Warning/Error during scan, ignore as it scans continuously
      }
    );

    return () => {
      scanner.clear().catch(console.error);
    };
  }, [onScan]);

  return (
    <div className="modal-overlay">
      <div className="modal-content scanner-modal">
        <div className="modal-header">
          <h3>📷 Leitor de Código de Barras</h3>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          <p>Aponte a câmera para o código de barras ou QR Code.</p>
          <div id="reader" style={{ width: '100%', minHeight: '300px' }}></div>
          {error && <div className="error-text">{error}</div>}
        </div>
      </div>
    </div>
  );
}
