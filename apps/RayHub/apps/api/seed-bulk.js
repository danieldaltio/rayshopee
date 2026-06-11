const http = require('http');

const delay = ms => new Promise(res => setTimeout(res, ms));

async function injectBulk() {
  const numOrders = 10;
  console.log(`Injetando ${numOrders} pedidos de teste...`);

  const timestamp = Date.now().toString().slice(-4);
  for (let i = 1; i <= numOrders; i++) {
    const orderSn = `BR26068282BATCH${timestamp}${i.toString().padStart(3, '0')}`;
    const payload = JSON.stringify({
      shopee_order_sn: orderSn,
      status: "Para Emitir",
      subtotal: 10.00 * i,
      frete: 15.00,
      desconto: 0,
      total: (10.00 * i) + 15.00,
      shopee_comissao: 3.00,
      customer: {
        name: `Cliente Batch Teste ${i}`,
        cpf_cnpj: "12345678901",
        shopee_buyer_username: `buyerbatch${i}`,
        endereco_rua: "Rua do Lote",
        endereco_numero: `${i}00`,
        endereco_cidade: "São Paulo",
        endereco_uf: "SP",
        endereco_cep: "01000-000"
      },
      items: [
        {
          product_id: "33550c21-fa40-48f0-b4d0-182ce7665d71", // Batedeira Altimar
          quantidade: 1,
          preco_unitario: 10.00 * i
        }
      ]
    });

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/orders/mock-inject',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        res.setEncoding('utf8');
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            console.log(`[SUCESSO] Pedido ${orderSn} criado.`);
            resolve();
          } else {
            console.error(`[ERRO] Pedido ${orderSn} falhou. Status: ${res.statusCode} - ${data}`);
            resolve(); // just resolve to continue the loop
          }
        });
      });

      req.on('error', (e) => {
        console.error(`[ERRO de Rede] ${e.message}`);
        resolve();
      });

      req.write(payload);
      req.end();
    });

    // Pequena pausa para garantir a ordem no banco se necessário
    await delay(200);
  }

  console.log("Injeção em lote concluída!");
}

injectBulk();
