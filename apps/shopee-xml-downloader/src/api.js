export async function fetchOrders(timeFrom, timeTo) {
  const params = new URLSearchParams({ time_from: timeFrom, time_to: timeTo });
  const res = await fetch(`/api/xml-downloader/orders?${params}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Erro ao buscar pedidos');
  }
  return res.json();
}

export async function downloadXml(orderSn) {
  const res = await fetch(`/api/xml-downloader/orders/${orderSn}/xml`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Erro ao baixar XML');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `NFe_${orderSn}.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadZip(orderSns) {
  if (!orderSns || orderSns.length === 0) throw new Error('Nenhum pedido selecionado');
  
  const res = await fetch('/api/xml-downloader/zip', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ orders: orderSns })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: 'Erro desconhecido no servidor' }));
    throw new Error(err.message || 'Erro ao gerar ZIP');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `XMLs_${Date.now()}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadXmlByAccessKey(accessKey) {
  if (!accessKey || accessKey.length !== 44) throw new Error('Chave de acesso inválida');
  const res = await fetch(`/api/xml-downloader/access-key/${accessKey}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Erro ao baixar XML por chave');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `NFe_${accessKey}.xml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function checkHealth() {
  const res = await fetch('/api/health');
  return res.json();
}

export async function syncSefaz(timeFrom, timeTo) {
  const res = await fetch(`/api/xml-downloader/sync-sefaz?from=${timeFrom}&to=${timeTo}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Erro ao sincronizar SEFAZ');
  }
  return res.json();
}
