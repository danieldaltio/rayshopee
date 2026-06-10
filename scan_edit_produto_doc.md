# Documentação de Atualizações: ScanEditProduto

## 1. O Que Foi Feito
- **Correção de Estado da UI (Camera):** Ajustado o `ScannerScreen.kt` para garantir que o painel de edição recolha e a câmera volte a ser exibida automaticamente ao clicar no botão "Limpar".
- **Correção de Desserialização (Erro 408):** O backend Node.js (`server/index.js`) foi modificado para forçar a conversão de `item_id` para `String` na resposta JSON. O ID original era retornado como número muito grande (BigInt), o que causava falha silenciosa na desserialização do Kotlin/Retrofit no Android, resultando em Timeout (Erro 408).
- **Melhorias Visuais e UX:**
  - O valor do **Lucro** passou a ter formatação condicional de cores (Verde para lucro positivo, Vermelho para prejuízo).
  - O valor do **Estoque** também recebeu formatação condicional (Vermelho se for 0, Rosa suave se for menor que 5).
- **Conexão Estável em Redes Móveis (4G/5G):** Como a comunicação com o servidor local caía frequentemente gerando **Erro 404**, foi criado um script em Powershell (`tunnel.ps1`) com um loop infinito. Esse script reconecta o `localtunnel` na mesma URL (`rayshopeemobile99.loca.lt`) automaticamente em 2 segundos caso a conexão caia.

## 2. O Que Deu Certo
- A interface desenvolvida com Jetpack Compose respondeu perfeitamente à mudança de estados e à nova formatação visual condicional.
- O tratamento da tipagem de `itemId` para `String` do lado do servidor resolveu imediatamente as falhas de comunicação sem precisar reescrever a camada de rede do aplicativo.
- O script em Powershell se mostrou uma solução rápida, eficaz e resiliente para contornar a instabilidade crônica dos servidores gratuitos do `localtunnel`.

## 3. O Que Não Deu Certo e Por Que
- **Deploy no Render (Plano Gratuito):** O uso da API hospedada no Render (`rayshopee.onrender.com`) não foi viável para testes móveis porque instâncias gratuitas dormem após 15 minutos (Cold Start). Isso atrasava a resposta em mais de 50 segundos, fazendo o app Android estourar o tempo limite de espera.
- **Túneis alternativos (Cloudflared, Serveo, Pinggy):** Soluções alternativas de túnel via linha de comando ou deram erro de protocolo bloqueado (QUIC/UDP timeout), ou exigiam chaves SSH cadastradas, o que dificultava a automação sem interação manual contínua.

## 4. Possíveis Melhorias Futuras
1. **Hospedagem Dedicada:** Migrar o servidor backend Node.js para uma VPS ou plano pago que não tenha _Cold Start_, eliminando de vez a necessidade de usar o `localtunnel` localmente.
2. **Offline-First:** Implementar armazenamento local (ex: Room Database) no `ScanEditProduto` para que as leituras e edições fiquem salvas na fila do celular e sincronizem sozinhas caso o servidor ou a rede móvel oscile.
3. **Padronização de Tipagem (BigInt -> String):** Revisar todo o ecossistema (backend e mobile) para garantir que **todos** os IDs gigantescos da Shopee (como `model_id`, `order_id`, `item_id`) sejam traficados exclusivamente como `String` via JSON, prevenindo quebras silenciosas na arquitetura Android.
