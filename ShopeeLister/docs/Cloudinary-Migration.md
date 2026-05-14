# Documentação: Migração de Remoção de Fundo (Cloudinary)

**Versão do App:** 1.1.0
**Data:** 13 de Maio de 2026

## O Problema Inicial
O sistema original utilizava a API `remove.bg`, que se provou instável e com limitação severa de créditos gratuitos. A tentativa de substituição envolvia migrar o serviço para a inteligência artificial do **Cloudinary**.

## Tentativas e Falhas (O que NÃO deu certo)

1. **Upload via SDK (Unsigned):**
   - **Abordagem:** Utilizar a biblioteca oficial `com.cloudinary:cloudinary-android` configurando o upload com preset *unsigned*.
   - **Por que falhou:** O recurso de remoção de fundo via IA (`background_removal: cloudinary_ai`) é restrito e retorna erro `HTTP 401 - Unknown API Key` se a requisição não for assinada.
   
2. **Backend Proxy (Node.js):**
   - **Abordagem:** Enviar a foto crua do Android para um endpoint local (Node.js) no PC via Ngrok ou `adb reverse` (localhost), onde o servidor assinaria o upload com o `api_secret`.
   - **Por que falhou:** 
     - **Ngrok:** O URL do Ngrok muda e, como estava em cache persistente no app (`ConfigStore`), o app enviava dados para um túnel offline.
     - **Localhost:** O Android bloqueia tráfego cleartext (HTTP) por padrão. O arquivo `network_security_config.xml` só permitia IPs específicos, fazendo requisições a `localhost` falharem silenciosamente.
     
3. **Download Síncrono Pós-Upload:**
   - **Abordagem:** Após conseguir o upload assinado, baixar a `secure_url` devolvida na mesma resposta HTTP.
   - **Por que falhou:** O Cloudinary executa a remoção de fundo de forma **assíncrona**. A `secure_url` primária devolve a imagem com o fundo ainda presente até que o processamento interno conclua. O app só "piscava" sem mudança visual.

## A Solução Final (O que DEU certo)

A solução perfeita abandonou o servidor proxy, gerando autonomia total no app mobile, combinada com a solicitação explícita do processamento de imagem na URL.

1. **Assinatura SHA-1 Nativa:**
   - O aplicativo agora gera sua própria assinatura criptográfica (`java.security.MessageDigest SHA-1`) utilizando a `api_secret` injetada localmente.

2. **Upload Direto (`CloudinaryService.kt`):**
   - Construímos um POST manual via `OkHttp` contendo um `MultipartBody` devidamente formatado, passando a foto e a assinatura diretamente para `api.cloudinary.com`. Zero dependência de proxy externo.

3. **Gatilho de Transformação Dinâmica:**
   - Em vez de baixar a URL original, montamos dinamicamente uma URL de transformação:
     `https://res.cloudinary.com/<CLOUD>/image/upload/e_background_removal/v<VERSION>/<PUBLIC_ID>.png`
   - O parâmetro `e_background_removal` instrui os servidores CDN do Cloudinary a aplicarem a remoção de fundo on-the-fly.
   
4. **Download com Retry:**
   - Como a IA do Cloudinary pode levar até 5 segundos para gerar a máscara e cortar a imagem, implementamos uma função `downloadWithRetry`. O app faz tentativas de download a cada 4 segundos; o Cloudinary entrega a foto assim que estiver pronta.

## Mudanças de Código Relevantes
- `app/build.gradle.kts`: Version code incrementado para 2, version name para `1.1.0`.
- `CloudinaryService.kt`: Reescrito totalmente. Código manual de multipart upload + signature gerada na classe + URL replacement.
- `ShopeeListerApp.kt`: Lógica de injeção automática de credenciais do `BuildConfig` caso o usuário ainda não as possua no DataStore.
- `gradle.properties`: Correção do identificador de cloud de `dlpquqsmw` para `dcudjmopb`.
