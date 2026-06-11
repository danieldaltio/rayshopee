# Post-Mortem: Shopee API & Vercel Cold Start Bug

## 📝 Resumo do Incidente
O aplicativo Android RayShopee não estava exibindo as variações englobadas e os respectivos preços de custo dos produtos. Apenas uma variação "Padrão" com custo `0.0` estava sendo exibida ao escanear o código de barras.

## ❌ O Que Não Estava Dando Certo e o Por Quê

Houve duas falhas técnicas isoladas que culminaram neste bug:

1. **Problema de Rede/Cache no Android App**: O app Android estava com a URL do backend apontando fixamente para um servidor de desenvolvimento local (`http://192.168.15.7:3003`). Assim, ele não recebia as atualizações implantadas no ambiente de produção da Vercel.
   
2. **Ciclo de Vida Serverless na Vercel (Cold Start)**: O nosso código dependia de uma variável global (`tokenExpiresAt`) para decidir se o token de acesso da Shopee deveria ser renovado. No ambiente Serverless da Vercel, o contêiner "desliga" após a inatividade (Cold Start), fazendo com que essa variável zerasse na memória, mas o sistema utilizava o token antigo das variáveis de ambiente `.env`.

3. **Falha Silenciosa no Tratamento de Erros da Shopee API**: Como o token estava expirado, a API da Shopee rejeitava a chamada `get_model_list` para buscar as variações do produto. Segundo a documentação, a Shopee deveria retornar o código de erro `"error_auth"`. Entretanto, na prática, a Shopee retornava um código com erro ortográfico: `"invalid_acceess_token"`. O nosso interceptador `shopeeGet` não tratava esse erro específico e retornava vazio.
   * **Consequência**: Sem as variações vindas da Shopee, o backend assumia que o produto não possuía variações. Ele injetava uma variação "Padrão" genérica (com `model_id = '0'`), o que por sua vez fazia com que a busca de custos no Supabase (que é mapeada pelo `model_id` real) não encontrasse nada, retornando `0.0`.

## ✅ O Que Deu Certo (A Solução)

1. **Correção do Tratamento de Erros**: O `shopeeGet` e `shopeePost` foram atualizados para identificar erros como `"invalid_acceess_token"` (e qualquer erro contendo a string "token" ou "auth").
2. **Recuperação Resiliente de Token**: Alteramos a função `ensureValidToken` para que, ao inicializar na Vercel (`tokenExpiresAt === 0`), ela se conecte ao banco de dados Supabase (tabela `Company`) para recuperar o token mais recente que pode ter sido gerado por outra sessão (ou localmente).
3. **Atualização do Client**: A `BASE_URL` no aplicativo Android foi atualizada para a URL correta da Vercel e o aplicativo foi recompilado e re-instalado fisicamente no dispositivo via cabo USB e ADB.

---

## 🚀 Possíveis Melhorias (Next Steps)

Para evitar que problemas de arquitetura ou rede como esse voltem a ocorrer no futuro, recomendo as seguintes melhorias:

1. **Monitoramento e Logs (Firebase Crashlytics / Sentry)**
   - Integrar o Sentry no backend NodeJS e Crashlytics no App Android. Atualmente, os erros silenciosos de negócio (como uma variação não encontrada) não geram alertas automatizados.

2. **Banco de Dados Local (Offline-First)**
   - Retomar a implementação da sincronização Offline utilizando Room Database (iniciada no `ProductRepositoryImpl` e `SyncWorker`, mas abandonada). Isso evitaria que o usuário ficasse sem os custos do produto mesmo se a API da Vercel caísse.

3. **Gerenciamento Descentralizado de Sessão da Shopee**
   - Centralizar a renovação do token (OAuth2 Refresh) através de um Cron Job agendado independente. Assim, as funções serverless da Vercel seriam **ReadOnly** em relação aos tokens de acesso, apenas lendo o token mais recente do Supabase em cada invocação e evitando concorrência no momento do Refresh.

4. **Tratamento de Fallback Nativo no App**
   - Melhorar o mecanismo de *Fallback URLs* (que hoje estão num List comentado) implementando um Retry Automático. Se o app detectar *Timeout* na Vercel (504 Gateway Timeout), ele tentaria acessar automaticamente via `loca.lt` (LocalTunnel).
