const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createMockOrder() {
  try {
    // 1. Create a dummy customer
    const customer = await prisma.customer.create({
      data: {
        name: 'Cliente Teste Shopee',
        cpf_cnpj: '12345678901',
        shopee_buyer_username: 'shopeetest123',
        endereco_rua: 'Rua das Flores',
        endereco_numero: '123',
        endereco_cidade: 'São Paulo',
        endereco_uf: 'SP',
        endereco_cep: '01000-000',
      },
    });

    // 2. Create a dummy product
    const product = await prisma.product.create({
      data: {
        name: 'Produto de Teste (NF-e Flow)',
        sku: 'TEST-NFE-01',
        shopee_item_id: 999999999n, // BigInt requires "n" at the end in JS/TS or passing BigInt()
        price: 99.90,
        stock: 10,
        // NCM and CFOP needed for NF-e logic (even if mocked)
        ncm: '61091000', 
        cfop: '5102',
      },
    });

    // 3. Create the dummy order in "Para Emitir"
    const orderSn = `BR${Math.floor(Math.random() * 10000000)}TEST`;
    
    const order = await prisma.order.create({
      data: {
        shopee_order_sn: orderSn,
        status: 'Para Emitir',
        canal: 'shopee',
        customer_id: customer.id,
        subtotal: 99.90,
        frete: 15.00,
        desconto: 0,
        total: 114.90,
        shopee_comissao: 19.98,
        data_pedido: new Date(),
        items: {
          create: [
            {
              product_id: product.id,
              quantidade: 1,
              preco_unitario: 99.90,
              subtotal: 99.90,
            }
          ]
        }
      },
    });

    console.log(`[SUCESSO] Pedido mock criado: ${order.shopee_order_sn} (ID: ${order.id})`);
    console.log('Você já pode verificar este pedido no dashboard!');
  } catch (error) {
    console.error('Erro ao criar pedido mock:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createMockOrder();
