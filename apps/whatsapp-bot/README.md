# RayShopee WhatsApp Bot

Este é um bot do WhatsApp projetado para trabalhar em conjunto com o **RayShopee**. Com ele, você pode alterar o preço e o estoque dos seus produtos da Shopee rapidamente. 

Basta tirar uma foto do código de barras de um produto com o seu celular e enviar para o bot. Ele fará a leitura e pedirá o novo preço e o novo estoque!

## Como Usar

1. Certifique-se de ter rodado o \`npm install\` dentro desta pasta.
2. Inicie o bot executando o comando no terminal:
   \`\`\`bash
   node index.js
   \`\`\`
3. Um QR Code aparecerá no terminal. Abra o WhatsApp no seu celular, vá em **Aparelhos Conectados** e escaneie o código.
4. Após conectar, você (ou qualquer número configurado) pode enviar uma foto contendo o código de barras do produto.
5. O bot irá ler a imagem e confirmar o SKU lido.
6. Em seguida, responda com o novo preço e estoque no formato sugerido (exemplo: \`15.90 10\`).
7. O bot irá se comunicar com a API do RayShopee (que deve estar rodando em \`http://localhost:3001\`) e atualizará o produto automaticamente.

## Dicas

- Tente focar bem no código de barras e garantir que há boa iluminação para que a biblioteca de leitura visual possa reconhecê-lo.
- Caso o código não seja reconhecido, você pode testar tirando a foto mais de perto.
- Se o formato do preço e estoque não for aceito, verifique se você não colocou palavras a mais. O formato deve ser sempre \`<Preço> <Estoque>\` separados por espaço. Você pode usar ponto \`.\` ou vírgula \`,\` no preço.

## Funcionalidades
- [x] Conexão WhatsApp via \`whatsapp-web.js\`
- [x] Leitura de Código de Barras de Imagens utilizando \`@zxing/library\` e \`jimp\`
- [x] Integração com API Local \`RayShopee\` (Busca de SKU e Bulk Update)
